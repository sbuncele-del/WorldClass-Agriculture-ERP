import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all delivery routes
router.use(tenantMiddleware);

// Get pool from app
const getPool = (req: Request): Pool => {
  return req.app.get('pool');
};

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate unique POD reference
const generatePODReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex');
  return `POD-${timestamp}-${random}`.toUpperCase();
};

/**
 * POST /api/delivery/initiate-verification
 * Called when driver clicks "I've Arrived" - sends verification code to customer
 */
router.post('/initiate-verification', async (req: Request, res: Response) => {
  const pool = getPool(req);
  const { tripId, driverId } = req.body;

  try {
    // Get trip and customer details
    const tripResult = await pool.query(`
      SELECT 
        t.id, t.trip_number, t.status,
        t.delivery_contact_name, t.delivery_contact_phone,
        c.name as customer_name, c.verified_phone
      FROM logistics_trips t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = $1
    `, [tripId]);

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    
    // Use verified phone from customer record (set by office)
    const verifiedPhone = trip.verified_phone || trip.delivery_contact_phone;
    
    if (!verifiedPhone) {
      return res.status(400).json({ 
        success: false, 
        error: 'No verified contact phone for this delivery' 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store verification code
    await pool.query(`
      INSERT INTO delivery_verifications 
        (trip_id, verification_code, customer_phone, expires_at, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (trip_id) 
      DO UPDATE SET 
        verification_code = $2,
        customer_phone = $3,
        expires_at = $4,
        attempts = 0,
        verified_at = NULL,
        created_at = NOW()
    `, [tripId, verificationCode, verifiedPhone, expiresAt, driverId]);

    // Update trip status
    await pool.query(`
      UPDATE logistics_trips 
      SET status = 'at-destination', arrived_at = NOW()
      WHERE id = $1
    `, [tripId]);

    // TODO: Send SMS with verification code
    // In production, integrate with SMS provider (Twilio, Africa's Talking, etc.)
    console.log(`📱 SMS to ${verifiedPhone}: Your delivery verification code is ${verificationCode}. Trip: ${trip.trip_number}`);

    // Log the event
    await pool.query(`
      INSERT INTO delivery_events (trip_id, event_type, event_data, created_by)
      VALUES ($1, 'verification_sent', $2, $3)
    `, [tripId, JSON.stringify({ phone: verifiedPhone.slice(-4), code_sent: true }), driverId]);

    res.json({
      success: true,
      message: 'Verification code sent to customer',
      data: {
        phoneLastFour: verifiedPhone.slice(-4),
        expiresAt,
        contactName: trip.delivery_contact_name
      }
    });

  } catch (error) {
    console.error('Error initiating verification:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate verification' });
  }
});

/**
 * POST /api/delivery/verify-code
 * Driver enters the code provided by customer
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  const pool = getPool(req);
  const { tripId, code, driverId } = req.body;

  try {
    // Get verification record
    const result = await pool.query(`
      SELECT * FROM delivery_verifications
      WHERE trip_id = $1 AND verified_at IS NULL
    `, [tripId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No pending verification found' 
      });
    }

    const verification = result.rows[0];

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Check attempts (max 5)
    if (verification.attempts >= 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Too many attempts. Please contact dispatch.' 
      });
    }

    // Increment attempts
    await pool.query(`
      UPDATE delivery_verifications 
      SET attempts = attempts + 1 
      WHERE id = $1
    `, [verification.id]);

    // Verify code
    if (verification.verification_code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid verification code',
        attemptsRemaining: 4 - verification.attempts
      });
    }

    // Code is valid - mark as verified
    await pool.query(`
      UPDATE delivery_verifications 
      SET verified_at = NOW(), verified_by = $2
      WHERE id = $1
    `, [verification.id, driverId]);

    // Generate POD reference
    const podReference = generatePODReference();

    // Create POD record
    await pool.query(`
      INSERT INTO proof_of_delivery (trip_id, pod_reference, verification_id, status)
      VALUES ($1, $2, $3, 'pending_upload')
    `, [tripId, podReference, verification.id]);

    // Log event
    await pool.query(`
      INSERT INTO delivery_events (trip_id, event_type, event_data, created_by)
      VALUES ($1, 'code_verified', $2, $3)
    `, [tripId, JSON.stringify({ verified: true }), driverId]);

    res.json({
      success: true,
      message: 'Verification successful! Please upload proof of delivery.',
      data: {
        podReference,
        canUploadPOD: true
      }
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ success: false, error: 'Failed to verify code' });
  }
});

/**
 * POST /api/delivery/upload-pod
 * Upload proof of delivery documents/photos
 */
router.post('/upload-pod', async (req: Request, res: Response) => {
  const pool = getPool(req);
  const { tripId, podReference, driverId, files } = req.body;
  // In production, files would come from multer middleware

  try {
    // Validate POD record exists
    const podResult = await pool.query(`
      SELECT * FROM proof_of_delivery WHERE trip_id = $1 AND pod_reference = $2
    `, [tripId, podReference]);

    if (podResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'POD record not found' });
    }

    const pod = podResult.rows[0];

    // In production: Upload files to S3/Azure Blob and get URLs
    // For now, simulate with metadata
    const uploadedFiles = (files || []).map((file: any, index: number) => ({
      id: `file-${Date.now()}-${index}`,
      type: file.type || 'photo',
      name: file.name || `pod_image_${index + 1}.jpg`,
      url: file.url || `https://storage.example.com/pod/${podReference}/${index}.jpg`,
      uploadedAt: new Date()
    }));

    // Update POD record
    await pool.query(`
      UPDATE proof_of_delivery 
      SET 
        files = $2,
        status = 'uploaded',
        uploaded_at = NOW(),
        uploaded_by = $3
      WHERE id = $1
    `, [pod.id, JSON.stringify(uploadedFiles), driverId]);

    // Log event
    await pool.query(`
      INSERT INTO delivery_events (trip_id, event_type, event_data, created_by)
      VALUES ($1, 'pod_uploaded', $2, $3)
    `, [tripId, JSON.stringify({ files: uploadedFiles.length, reference: podReference }), driverId]);

    res.json({
      success: true,
      message: 'Proof of delivery uploaded successfully',
      data: {
        podReference,
        filesUploaded: uploadedFiles.length
      }
    });

  } catch (error) {
    console.error('Error uploading POD:', error);
    res.status(500).json({ success: false, error: 'Failed to upload POD' });
  }
});

/**
 * POST /api/delivery/complete
 * Final delivery confirmation after verification and POD upload
 */
router.post('/complete', async (req: Request, res: Response) => {
  const pool = getPool(req);
  const { tripId, driverId, notes, customerSignature } = req.body;

  try {
    // Verify all requirements are met
    const checkResult = await pool.query(`
      SELECT 
        t.id, t.trip_number, t.status,
        v.verified_at,
        p.status as pod_status, p.pod_reference
      FROM logistics_trips t
      LEFT JOIN delivery_verifications v ON t.id = v.trip_id
      LEFT JOIN proof_of_delivery p ON t.id = p.trip_id
      WHERE t.id = $1
    `, [tripId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const trip = checkResult.rows[0];

    // Check verification
    if (!trip.verified_at) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer verification required before completing delivery' 
      });
    }

    // Check POD (optional but recommended)
    const hasPOD = trip.pod_status === 'uploaded';

    // Update trip status to delivered
    await pool.query(`
      UPDATE logistics_trips 
      SET 
        status = 'delivered',
        delivered_at = NOW(),
        delivery_notes = $2,
        completed_by = $3
      WHERE id = $1
    `, [tripId, notes, driverId]);

    // Update POD status
    if (hasPOD) {
      await pool.query(`
        UPDATE proof_of_delivery 
        SET status = 'confirmed', confirmed_at = NOW()
        WHERE trip_id = $1
      `, [tripId]);
    }

    // Create invoice draft
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    await pool.query(`
      INSERT INTO invoices (trip_id, invoice_number, status, created_by)
      VALUES ($1, $2, 'pending_approval', $3)
    `, [tripId, invoiceNumber, driverId]);

    // Log completion event
    await pool.query(`
      INSERT INTO delivery_events (trip_id, event_type, event_data, created_by)
      VALUES ($1, 'delivery_completed', $2, $3)
    `, [tripId, JSON.stringify({ 
      verified: true, 
      hasPOD, 
      invoiceNumber,
      completedAt: new Date()
    }), driverId]);

    // Notify dispatch (would trigger WebSocket/push notification)
    console.log(`✅ Delivery completed: ${trip.trip_number} - Invoice: ${invoiceNumber}`);

    res.json({
      success: true,
      message: 'Delivery completed successfully!',
      data: {
        tripNumber: trip.trip_number,
        invoiceNumber,
        podReference: trip.pod_reference,
        verifiedDelivery: true,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ success: false, error: 'Failed to complete delivery' });
  }
});

/**
 * POST /api/delivery/resend-code
 * Resend verification code if customer didn't receive it
 */
router.post('/resend-code', async (req: Request, res: Response) => {
  const pool = getPool(req);
  const { tripId, driverId } = req.body;

  try {
    // Get existing verification
    const result = await pool.query(`
      SELECT * FROM delivery_verifications 
      WHERE trip_id = $1 AND verified_at IS NULL
    `, [tripId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No pending verification' });
    }

    const verification = result.rows[0];

    // Generate new code
    const newCode = generateVerificationCode();
    const newExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(`
      UPDATE delivery_verifications 
      SET verification_code = $2, expires_at = $3, attempts = 0
      WHERE id = $1
    `, [verification.id, newCode, newExpiry]);

    // TODO: Send SMS
    console.log(`📱 Resend SMS to ${verification.customer_phone}: Code ${newCode}`);

    res.json({
      success: true,
      message: 'New verification code sent',
      data: {
        phoneLastFour: verification.customer_phone.slice(-4),
        expiresAt: newExpiry
      }
    });

  } catch (error) {
    console.error('Error resending code:', error);
    res.status(500).json({ success: false, error: 'Failed to resend code' });
  }
});

/**
 * GET /api/delivery/status/:tripId
 * Get current delivery verification status
 */
router.get('/status/:tripId', async (req: Request, res: Response) => {
  const pool = getPool(req);
  const { tripId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        t.id, t.trip_number, t.status,
        v.verification_code IS NOT NULL as code_sent,
        v.verified_at IS NOT NULL as code_verified,
        v.expires_at as code_expires,
        v.attempts as code_attempts,
        p.status as pod_status,
        p.pod_reference,
        p.files as pod_files
      FROM logistics_trips t
      LEFT JOIN delivery_verifications v ON t.id = v.trip_id
      LEFT JOIN proof_of_delivery p ON t.id = p.trip_id
      WHERE t.id = $1
    `, [tripId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const status = result.rows[0];

    res.json({
      success: true,
      data: {
        tripNumber: status.trip_number,
        tripStatus: status.status,
        verification: {
          codeSent: status.code_sent,
          codeVerified: status.code_verified,
          codeExpires: status.code_expires,
          attemptsUsed: status.code_attempts || 0
        },
        pod: {
          status: status.pod_status,
          reference: status.pod_reference,
          filesCount: status.pod_files ? JSON.parse(status.pod_files).length : 0
        },
        canComplete: status.code_verified && (status.pod_status === 'uploaded' || status.pod_status === null)
      }
    });

  } catch (error) {
    console.error('Error getting delivery status:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

export default router;
