import express from 'express';
import multer from 'multer';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

const router = express.Router();

// Initialize AWS Textract client with better error handling
let textractClient: TextractClient;
try {
  textractClient = new TextractClient({ 
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined
  });
  console.log('✅ AWS Textract client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize AWS Textract client:', error);
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

/**
 * POST /api/logistics/documents/extract
 * Upload and extract data from logistics documents (load confirmations, PODs, etc.)
 */
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    console.log(`📄 Processing document: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

    // Check if Textract client is initialized
    if (!textractClient) {
      console.error('❌ Textract client not initialized. Check AWS credentials.');
      return res.status(500).json({
        success: false,
        error: 'Document processing service not available',
        details: 'AWS Textract client not initialized. Check server configuration.'
      });
    }

    // Use AWS Textract to extract text
    console.log('🔍 Calling AWS Textract...');
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: file.buffer
      }
    });

    let textractResponse;
    try {
      textractResponse = await textractClient.send(command);
      console.log(`✅ Textract successful. Blocks found: ${textractResponse.Blocks?.length || 0}`);
    } catch (textractError: any) {
      console.error('❌ Textract API error:', textractError);
      return res.status(500).json({
        success: false,
        error: 'AWS Textract processing failed',
        details: textractError.message || 'Unknown Textract error',
        hint: 'Check AWS credentials and permissions'
      });
    }
    
    // Extract all text from Textract response
    const extractedText = textractResponse.Blocks
      ?.filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n') || '';

    console.log(`📝 Extracted text length: ${extractedText.length} characters`);
    
    if (extractedText.length === 0) {
      console.warn('⚠️ No text extracted from document');
      return res.status(400).json({
        success: false,
        error: 'No text found in document',
        details: 'The document appears to be empty or text could not be detected. Please ensure the image is clear and contains readable text.'
      });
    }

    // Parse the extracted text into structured data
    console.log('🔄 Parsing extracted text...');
    const parsedData = parseLoadConfirmation(extractedText);
    console.log(`✅ Parsed data confidence: ${parsedData.confidence_score}%`);

    res.json({
      success: true,
      message: 'Document processed successfully',
      filename: file.originalname,
      extractedText: extractedText,
      parsedData: parsedData,
      confidence: parsedData.confidence_score,
      processedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Document processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process document',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Helper function to parse load confirmation text
 * This will extract structured data from OCR text
 */
export function parseLoadConfirmation(text: string): any {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract patterns
  const patterns = {
    loadNumber: /(?:load|trip|ref)(?:\s*#|\s*no\.?|\s*number)?:?\s*(\d+)/i,
    company: /(?:company|transporter|carrier|operator)(?:\s*name)?:?\s*([^\n]+)/i,
    vat: /vat(?:\s*no\.?|\s*number|\s*reg)?:?\s*(\d+)/i,
    driver: /driver(?:\s*name)?:?\s*([^\n]+)/i,
    vehicle: /(?:vehicle|truck|registration|reg)(?:\s*no\.?)?:?\s*([A-Z0-9\s-]+)/i,
    commodity: /(?:commodity|goods|cargo|product)(?:\s*type)?:?\s*([^\n]+)/i,
    rate: /(?:rate|price|charge|cost)(?:\s*per)?:?\s*r?\s*([\d,]+(?:\.\d{2})?)/i,
    collection: /(?:collection|pickup|load|from)(?:\s*address)?:?\s*([^\n]+)/i,
    delivery: /(?:delivery|drop(?:\s*off)?|to|destination)(?:\s*address)?:?\s*([^\n]+)/i,
    date: /(?:date|loaded|collected)(?:\s*on)?:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    contact: /(?:contact|attn|attention)(?:\s*person)?:?\s*([^\n]+)/i,
    phone: /(?:tel|phone|cell|mobile)(?:\s*no\.?)?:?\s*([\d\s\(\)\+\-]+)/i,
    billTo: /(?:bill\s*to|customer|client|broker)(?:\s*name)?:?\s*([^\n]+)/i,
    invoiceRef: /(?:invoice|order|po)(?:\s*ref|\s*no\.?)?:?\s*([^\n]+)/i
  };

  const extracted: any = {
    transporter: {},
    customer: {},
    load: {},
    route: {}
  };

  // Join all text for full text search
  const fullText = text.toLowerCase();

  // Extract each field
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Load number
    const loadMatch = line.match(patterns.loadNumber);
    if (loadMatch && !extracted.load.load_number) {
      extracted.load.load_number = loadMatch[1];
    }

    // Company/Transporter name
    const companyMatch = line.match(patterns.company);
    if (companyMatch && !extracted.transporter.company_name) {
      extracted.transporter.company_name = companyMatch[1].trim();
    }

    // VAT number
    const vatMatch = line.match(patterns.vat);
    if (vatMatch && !extracted.transporter.vat_number) {
      extracted.transporter.vat_number = vatMatch[1];
    }

    // Driver
    const driverMatch = line.match(patterns.driver);
    if (driverMatch && !extracted.load.driver_name) {
      extracted.load.driver_name = driverMatch[1].trim();
    }

    // Vehicle
    const vehicleMatch = line.match(patterns.vehicle);
    if (vehicleMatch && !extracted.load.vehicle_registration) {
      extracted.load.vehicle_registration = vehicleMatch[1].trim();
    }

    // Commodity
    const commodityMatch = line.match(patterns.commodity);
    if (commodityMatch && !extracted.load.commodity) {
      extracted.load.commodity = commodityMatch[1].trim();
    }

    // Rate
    const rateMatch = line.match(patterns.rate);
    if (rateMatch && !extracted.load.rate) {
      extracted.load.rate = parseFloat(rateMatch[1].replace(/,/g, ''));
    }

    // Collection address
    const collectionMatch = line.match(patterns.collection);
    if (collectionMatch && !extracted.route.collection_address) {
      extracted.route.collection_address = collectionMatch[1].trim();
    }

    // Delivery address
    const deliveryMatch = line.match(patterns.delivery);
    if (deliveryMatch && !extracted.route.delivery_address) {
      extracted.route.delivery_address = deliveryMatch[1].trim();
    }

    // Date
    const dateMatch = line.match(patterns.date);
    if (dateMatch && !extracted.load.load_date) {
      extracted.load.load_date = dateMatch[1];
    }

    // Contact person
    const contactMatch = line.match(patterns.contact);
    if (contactMatch && !extracted.customer.contact_person) {
      extracted.customer.contact_person = contactMatch[1].trim();
    }

    // Phone
    const phoneMatch = line.match(patterns.phone);
    if (phoneMatch && !extracted.transporter.phone) {
      extracted.transporter.phone = phoneMatch[1].trim();
    }

    // Bill to / Customer
    const billToMatch = line.match(patterns.billTo);
    if (billToMatch && !extracted.customer.company_name) {
      extracted.customer.company_name = billToMatch[1].trim();
    }

    // Invoice/Order reference
    const refMatch = line.match(patterns.invoiceRef);
    if (refMatch && !extracted.load.order_number) {
      extracted.load.order_number = refMatch[1].trim();
    }
  }

  // Set defaults
  extracted.document_type = 'load_confirmation';
  extracted.confidence_score = calculateConfidenceScore(extracted);
  extracted.load.rate_type = 'per_load';
  extracted.load.quantity = 1;
  extracted.customer.is_new = false; // Will be determined by database check

  return extracted;
}

/**
 * Calculate confidence score based on how many fields were extracted
 */
function calculateConfidenceScore(data: any): number {
  const requiredFields = [
    data.load?.load_number,
    data.transporter?.company_name,
    data.load?.rate,
    data.route?.collection_address,
    data.route?.delivery_address
  ];

  const optionalFields = [
    data.transporter?.vat_number,
    data.load?.driver_name,
    data.load?.vehicle_registration,
    data.load?.commodity,
    data.customer?.company_name,
    data.customer?.contact_person
  ];

  const requiredScore = requiredFields.filter(f => f).length / requiredFields.length;
  const optionalScore = optionalFields.filter(f => f).length / optionalFields.length;

  // Required fields are worth 70%, optional 30%
  const finalScore = (requiredScore * 0.7 + optionalScore * 0.3) * 100;

  return Math.round(finalScore * 10) / 10; // Round to 1 decimal
}

export default router;
