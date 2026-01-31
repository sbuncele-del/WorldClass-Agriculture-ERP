/**
 * Healthcare Pharmacy & Inventory Automation Service
 * 
 * Features:
 * - Automated Reorder Management
 * - Expiry Date Tracking & Alerts
 * - Batch/Lot Number Management
 * - Dispensing Workflow Automation
 * - Controlled Substance Tracking (Schedule 5-7)
 * - NAPPI Code Integration
 * - Supplier Auto-Ordering
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// South African NAPPI Code Database (Sample)
export const NAPPI_CODES: Record<string, {
  nappiCode: string;
  description: string;
  schedule: number; // 0-7 (7 = most controlled)
  sepPrice: number; // Single Exit Price
  manufacturer: string;
  packSize: number;
  dosageForm: string;
  activeIngredient: string;
  requiresScript: boolean;
}> = {
  // Schedule 0 - OTC
  '700907': { nappiCode: '700907', description: 'Panado 500mg Tablets', schedule: 0, sepPrice: 28.50, manufacturer: 'Aspen', packSize: 24, dosageForm: 'Tablet', activeIngredient: 'Paracetamol', requiresScript: false },
  '706717': { nappiCode: '706717', description: 'Allergex 10mg Tablets', schedule: 0, sepPrice: 45.00, manufacturer: 'Adcock', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Chlorpheniramine', requiresScript: false },
  
  // Schedule 1 - Pharmacy Only
  '708234': { nappiCode: '708234', description: 'Imodium 2mg Capsules', schedule: 1, sepPrice: 89.00, manufacturer: 'J&J', packSize: 20, dosageForm: 'Capsule', activeIngredient: 'Loperamide', requiresScript: false },
  
  // Schedule 2 - Pharmacist Supervision
  '710456': { nappiCode: '710456', description: 'Nurofen Plus', schedule: 2, sepPrice: 95.00, manufacturer: 'Reckitt', packSize: 24, dosageForm: 'Tablet', activeIngredient: 'Ibuprofen/Codeine', requiresScript: false },
  
  // Schedule 3 - Prescription Only
  '712001': { nappiCode: '712001', description: 'Augmentin 625mg', schedule: 3, sepPrice: 185.00, manufacturer: 'GSK', packSize: 14, dosageForm: 'Tablet', activeIngredient: 'Amoxicillin/Clavulanate', requiresScript: true },
  '712345': { nappiCode: '712345', description: 'Lipitor 20mg', schedule: 3, sepPrice: 320.00, manufacturer: 'Pfizer', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Atorvastatin', requiresScript: true },
  
  // Schedule 4 - Prescription + Records
  '714001': { nappiCode: '714001', description: 'Stilnox 10mg', schedule: 4, sepPrice: 180.00, manufacturer: 'Sanofi', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Zolpidem', requiresScript: true },
  '714567': { nappiCode: '714567', description: 'Ativan 1mg', schedule: 4, sepPrice: 95.00, manufacturer: 'Pfizer', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Lorazepam', requiresScript: true },
  
  // Schedule 5 - Controlled (Strict)
  '715001': { nappiCode: '715001', description: 'Ritalin 10mg', schedule: 5, sepPrice: 220.00, manufacturer: 'Novartis', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Methylphenidate', requiresScript: true },
  '715789': { nappiCode: '715789', description: 'Concerta 18mg', schedule: 5, sepPrice: 450.00, manufacturer: 'J&J', packSize: 30, dosageForm: 'ER Tablet', activeIngredient: 'Methylphenidate', requiresScript: true },
  
  // Schedule 6 - Narcotic
  '716001': { nappiCode: '716001', description: 'Morphine Sulfate 10mg', schedule: 6, sepPrice: 85.00, manufacturer: 'Aspen', packSize: 20, dosageForm: 'Tablet', activeIngredient: 'Morphine', requiresScript: true },
  '716234': { nappiCode: '716234', description: 'MST Continus 30mg', schedule: 6, sepPrice: 280.00, manufacturer: 'Mundipharma', packSize: 60, dosageForm: 'SR Tablet', activeIngredient: 'Morphine', requiresScript: true },
  
  // Chronic Medications
  '720001': { nappiCode: '720001', description: 'Glucophage 850mg', schedule: 3, sepPrice: 95.00, manufacturer: 'Merck', packSize: 60, dosageForm: 'Tablet', activeIngredient: 'Metformin', requiresScript: true },
  '720234': { nappiCode: '720234', description: 'Amloc 5mg', schedule: 3, sepPrice: 145.00, manufacturer: 'Aspen', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Amlodipine', requiresScript: true },
  '720567': { nappiCode: '720567', description: 'Pharmapress 10mg', schedule: 3, sepPrice: 125.00, manufacturer: 'Aspen', packSize: 30, dosageForm: 'Tablet', activeIngredient: 'Enalapril', requiresScript: true },
};

// Supplier Database
export const SUPPLIERS: Record<string, {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  minOrderValue: number;
  paymentTerms: string;
}> = {
  'SUP001': { id: 'SUP001', name: 'Alpha Pharm', email: 'orders@alphapharm.co.za', phone: '0800 023 456', leadTimeDays: 2, minOrderValue: 500, paymentTerms: '30 days' },
  'SUP002': { id: 'SUP002', name: 'Dis-Chem Distribution', email: 'wholesale@dischem.co.za', phone: '011 589 5000', leadTimeDays: 1, minOrderValue: 1000, paymentTerms: '30 days' },
  'SUP003': { id: 'SUP003', name: 'Clicks Distribution', email: 'supply@clicks.co.za', phone: '021 460 1911', leadTimeDays: 2, minOrderValue: 750, paymentTerms: '45 days' },
};

export class PharmacyInventoryService {
  private pool: Pool;
  private tenantId: string;

  constructor(pool: Pool, tenantId: string) {
    this.pool = pool;
    this.tenantId = tenantId;
  }

  // ============================================
  // 1. AUTO-REORDER SYSTEM
  // ============================================
  async checkAndGenerateReorders(): Promise<{
    itemsChecked: number;
    reordersGenerated: Array<{
      itemCode: string;
      itemName: string;
      currentStock: number;
      reorderLevel: number;
      orderQuantity: number;
      supplier: string;
      estimatedCost: number;
      priority: 'URGENT' | 'NORMAL' | 'LOW';
    }>;
    totalOrderValue: number;
    purchaseOrdersCreated: number;
  }> {
    // Get items below reorder level
    const result = await this.pool.query(
      `SELECT * FROM healthcare.pharmacy_stock 
       WHERE tenant_id = $1 AND current_quantity <= reorder_level
       ORDER BY (current_quantity::float / NULLIF(reorder_level, 0)) ASC`,
      [this.tenantId]
    );

    const reorders: any[] = [];
    let totalOrderValue = 0;
    const ordersBySupplier: Record<string, any[]> = {};

    for (const item of result.rows) {
      const nappiInfo = Object.values(NAPPI_CODES).find(n => 
        n.description.toLowerCase().includes(item.item_name.toLowerCase().split(' ')[0])
      );
      
      // Calculate order quantity (to optimal level)
      const orderQuantity = item.optimal_quantity - item.current_quantity;
      const unitPrice = nappiInfo?.sepPrice || item.unit_price || 50;
      const estimatedCost = orderQuantity * unitPrice;
      
      // Determine priority
      let priority: 'URGENT' | 'NORMAL' | 'LOW' = 'NORMAL';
      if (item.current_quantity === 0) priority = 'URGENT';
      else if (item.current_quantity <= item.reorder_level * 0.25) priority = 'URGENT';
      else if (item.current_quantity <= item.reorder_level * 0.5) priority = 'NORMAL';
      else priority = 'LOW';

      // Assign to supplier (round-robin for demo)
      const supplierKeys = Object.keys(SUPPLIERS);
      const supplierId = supplierKeys[reorders.length % supplierKeys.length];
      const supplier = SUPPLIERS[supplierId];

      const reorder = {
        itemCode: item.item_code,
        itemName: item.item_name,
        currentStock: item.current_quantity,
        reorderLevel: item.reorder_level,
        orderQuantity,
        supplier: supplier.name,
        supplierId,
        estimatedCost,
        priority,
        nappiCode: nappiInfo?.nappiCode,
        schedule: nappiInfo?.schedule,
      };

      reorders.push(reorder);
      totalOrderValue += estimatedCost;

      // Group by supplier for PO creation
      if (!ordersBySupplier[supplierId]) ordersBySupplier[supplierId] = [];
      ordersBySupplier[supplierId].push(reorder);
    }

    // Create purchase orders
    let purchaseOrdersCreated = 0;
    for (const [supplierId, items] of Object.entries(ordersBySupplier)) {
      const supplier = SUPPLIERS[supplierId];
      const poTotal = items.reduce((sum, i) => sum + i.estimatedCost, 0);
      
      if (poTotal >= supplier.minOrderValue) {
        const poNumber = `PO-PHARM-${Date.now()}`;
        
        try {
          await this.pool.query(
            `INSERT INTO healthcare.pharmacy_purchase_orders 
             (po_id, tenant_id, po_number, supplier_id, supplier_name, total_amount, status, 
              expected_delivery, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', CURRENT_DATE + $7, CURRENT_TIMESTAMP)`,
            [uuidv4(), this.tenantId, poNumber, supplierId, supplier.name, poTotal, supplier.leadTimeDays]
          );
          purchaseOrdersCreated++;
        } catch (e) {
          // Table might not exist
        }
      }
    }

    return {
      itemsChecked: result.rows.length,
      reordersGenerated: reorders,
      totalOrderValue,
      purchaseOrdersCreated,
    };
  }

  // ============================================
  // 2. EXPIRY DATE MANAGEMENT
  // ============================================
  async checkExpiryDates(): Promise<{
    expired: Array<{ itemCode: string; itemName: string; batchNumber: string; expiryDate: string; quantity: number; action: string }>;
    expiringSoon: Array<{ itemCode: string; itemName: string; batchNumber: string; expiryDate: string; quantity: number; daysUntilExpiry: number }>;
    alerts: string[];
    totalExpiredValue: number;
  }> {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Check for expired items
    const expiredResult = await this.pool.query(
      `SELECT * FROM healthcare.pharmacy_batches 
       WHERE tenant_id = $1 AND expiry_date < CURRENT_DATE AND quantity_remaining > 0`,
      [this.tenantId]
    );

    // Check for items expiring soon
    const expiringSoonResult = await this.pool.query(
      `SELECT *, (expiry_date - CURRENT_DATE) as days_until_expiry
       FROM healthcare.pharmacy_batches 
       WHERE tenant_id = $1 
         AND expiry_date >= CURRENT_DATE 
         AND expiry_date <= $2 
         AND quantity_remaining > 0
       ORDER BY expiry_date ASC`,
      [this.tenantId, ninetyDaysFromNow.toISOString().split('T')[0]]
    );

    const expired = expiredResult.rows.map(row => ({
      itemCode: row.item_code,
      itemName: row.item_name,
      batchNumber: row.batch_number,
      expiryDate: row.expiry_date,
      quantity: row.quantity_remaining,
      action: 'QUARANTINE & DISPOSE - Do not dispense',
    }));

    const expiringSoon = expiringSoonResult.rows.map(row => ({
      itemCode: row.item_code,
      itemName: row.item_name,
      batchNumber: row.batch_number,
      expiryDate: row.expiry_date,
      quantity: row.quantity_remaining,
      daysUntilExpiry: row.days_until_expiry,
    }));

    // Calculate total expired value
    let totalExpiredValue = 0;
    for (const item of expired) {
      const stockInfo = await this.pool.query(
        `SELECT unit_price FROM healthcare.pharmacy_stock WHERE item_code = $1 AND tenant_id = $2`,
        [item.itemCode, this.tenantId]
      );
      if (stockInfo.rows[0]) {
        totalExpiredValue += item.quantity * stockInfo.rows[0].unit_price;
      }
    }

    // Generate alerts
    const alerts: string[] = [];
    if (expired.length > 0) {
      alerts.push(`🚨 ${expired.length} items have EXPIRED - immediate disposal required`);
    }
    const urgentExpiry = expiringSoon.filter(e => e.daysUntilExpiry <= 30);
    if (urgentExpiry.length > 0) {
      alerts.push(`⚠️ ${urgentExpiry.length} items expiring within 30 days - prioritize for dispensing`);
    }

    return { expired, expiringSoon, alerts, totalExpiredValue };
  }

  // ============================================
  // 3. BATCH/LOT TRACKING
  // ============================================
  async receiveBatch(
    itemCode: string,
    batchNumber: string,
    quantity: number,
    expiryDate: Date,
    supplierInfo: { name: string; invoiceNumber: string }
  ): Promise<{
    success: boolean;
    batchId: string;
    message: string;
    fefoPosition: number; // First Expiry First Out position
  }> {
    const batchId = uuidv4();
    
    // Get item details
    const stockResult = await this.pool.query(
      `SELECT * FROM healthcare.pharmacy_stock WHERE item_code = $1 AND tenant_id = $2`,
      [itemCode, this.tenantId]
    );

    if (stockResult.rows.length === 0) {
      return { success: false, batchId: '', message: 'Item not found in stock', fefoPosition: 0 };
    }

    const item = stockResult.rows[0];

    // Insert batch record
    await this.pool.query(
      `INSERT INTO healthcare.pharmacy_batches 
       (batch_id, tenant_id, item_code, item_name, batch_number, quantity_received, quantity_remaining,
        expiry_date, supplier_name, supplier_invoice, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
      [batchId, this.tenantId, itemCode, item.item_name, batchNumber, quantity, quantity,
       expiryDate.toISOString().split('T')[0], supplierInfo.name, supplierInfo.invoiceNumber]
    );

    // Update stock level
    await this.pool.query(
      `UPDATE healthcare.pharmacy_stock 
       SET current_quantity = current_quantity + $1, last_restocked_at = CURRENT_TIMESTAMP
       WHERE item_code = $2 AND tenant_id = $3`,
      [quantity, itemCode, this.tenantId]
    );

    // Calculate FEFO position
    const fefoResult = await this.pool.query(
      `SELECT COUNT(*) as position FROM healthcare.pharmacy_batches 
       WHERE item_code = $1 AND tenant_id = $2 AND quantity_remaining > 0 
         AND expiry_date <= $3`,
      [itemCode, this.tenantId, expiryDate.toISOString().split('T')[0]]
    );

    return {
      success: true,
      batchId,
      message: `Batch ${batchNumber} received: ${quantity} units of ${item.item_name}`,
      fefoPosition: parseInt(fefoResult.rows[0]?.position || '1'),
    };
  }

  // ============================================
  // 4. DISPENSING WORKFLOW
  // ============================================
  async dispenseFromPrescription(
    prescriptionId: string,
    pharmacistId: string
  ): Promise<{
    success: boolean;
    dispensingRecord: any;
    batchesUsed: Array<{ batchNumber: string; quantity: number; expiryDate: string }>;
    warnings: string[];
    controlledSubstanceLog?: any;
  }> {
    const warnings: string[] = [];
    const batchesUsed: any[] = [];

    // Get prescription details
    const prescResult = await this.pool.query(
      `SELECT p.*, pt.first_name, pt.last_name, pt.id_number
       FROM healthcare.prescriptions p
       JOIN healthcare.patients pt ON p.patient_id = pt.patient_id
       WHERE p.prescription_id = $1 AND p.tenant_id = $2`,
      [prescriptionId, this.tenantId]
    );

    if (prescResult.rows.length === 0) {
      return { success: false, dispensingRecord: null, batchesUsed: [], warnings: ['Prescription not found'] };
    }

    const prescription = prescResult.rows[0];
    const medicationName = prescription.medication;
    const quantityNeeded = prescription.quantity || 1;

    // Find matching stock item
    const stockResult = await this.pool.query(
      `SELECT * FROM healthcare.pharmacy_stock 
       WHERE tenant_id = $1 AND item_name ILIKE $2`,
      [this.tenantId, `%${medicationName.split(' ')[0]}%`]
    );

    if (stockResult.rows.length === 0) {
      return { success: false, dispensingRecord: null, batchesUsed: [], warnings: [`${medicationName} not in stock`] };
    }

    const stockItem = stockResult.rows[0];
    
    // Check NAPPI/schedule info
    const nappiInfo = Object.values(NAPPI_CODES).find(n => 
      n.description.toLowerCase().includes(medicationName.toLowerCase().split(' ')[0])
    );

    // Check if controlled substance
    let controlledSubstanceLog = null;
    if (nappiInfo && nappiInfo.schedule >= 5) {
      warnings.push(`⚠️ CONTROLLED SUBSTANCE (Schedule ${nappiInfo.schedule}) - Requires register entry`);
      controlledSubstanceLog = {
        schedule: nappiInfo.schedule,
        nappiCode: nappiInfo.nappiCode,
        patientIdNumber: prescription.id_number,
        patientName: `${prescription.first_name} ${prescription.last_name}`,
        quantity: quantityNeeded,
        prescriberId: prescription.prescribed_by,
        dispensedBy: pharmacistId,
        timestamp: new Date().toISOString(),
        registerRequired: true,
      };
    }

    // Get batches using FEFO (First Expiry First Out)
    const batchResult = await this.pool.query(
      `SELECT * FROM healthcare.pharmacy_batches 
       WHERE item_code = $1 AND tenant_id = $2 AND quantity_remaining > 0
         AND expiry_date > CURRENT_DATE
       ORDER BY expiry_date ASC`,
      [stockItem.item_code, this.tenantId]
    );

    let remainingToDispense = quantityNeeded;
    for (const batch of batchResult.rows) {
      if (remainingToDispense <= 0) break;

      const dispenseFromBatch = Math.min(batch.quantity_remaining, remainingToDispense);
      
      batchesUsed.push({
        batchNumber: batch.batch_number,
        quantity: dispenseFromBatch,
        expiryDate: batch.expiry_date,
      });

      // Update batch
      await this.pool.query(
        `UPDATE healthcare.pharmacy_batches 
         SET quantity_remaining = quantity_remaining - $1
         WHERE batch_id = $2`,
        [dispenseFromBatch, batch.batch_id]
      );

      remainingToDispense -= dispenseFromBatch;
    }

    if (remainingToDispense > 0) {
      warnings.push(`⚠️ Insufficient stock: Only ${quantityNeeded - remainingToDispense} of ${quantityNeeded} dispensed`);
    }

    // Update stock level
    const dispensedQuantity = quantityNeeded - remainingToDispense;
    await this.pool.query(
      `UPDATE healthcare.pharmacy_stock 
       SET current_quantity = current_quantity - $1
       WHERE item_code = $2 AND tenant_id = $3`,
      [dispensedQuantity, stockItem.item_code, this.tenantId]
    );

    // Update prescription status
    await this.pool.query(
      `UPDATE healthcare.prescriptions 
       SET status = 'DISPENSED', dispensed_at = CURRENT_TIMESTAMP
       WHERE prescription_id = $1`,
      [prescriptionId]
    );

    // Create dispensing record
    const dispensingRecord = {
      id: uuidv4(),
      prescriptionId,
      patientName: `${prescription.first_name} ${prescription.last_name}`,
      medication: medicationName,
      quantityDispensed: dispensedQuantity,
      pharmacistId,
      dispensedAt: new Date().toISOString(),
      batchNumbers: batchesUsed.map(b => b.batchNumber).join(', '),
      schedule: nappiInfo?.schedule || 0,
    };

    return {
      success: true,
      dispensingRecord,
      batchesUsed,
      warnings,
      controlledSubstanceLog,
    };
  }

  // ============================================
  // 5. STOCK VALUATION & ANALYTICS
  // ============================================
  async getStockValuation(): Promise<{
    totalItems: number;
    totalUnits: number;
    totalValue: number;
    byCategory: Record<string, { items: number; units: number; value: number }>;
    slowMoving: Array<{ itemCode: string; itemName: string; daysSinceLastDispensed: number; value: number }>;
    fastMoving: Array<{ itemCode: string; itemName: string; monthlyTurnover: number }>;
  }> {
    const stockResult = await this.pool.query(
      `SELECT *, (current_quantity * COALESCE(unit_price, 50)) as stock_value
       FROM healthcare.pharmacy_stock 
       WHERE tenant_id = $1`,
      [this.tenantId]
    );

    let totalUnits = 0;
    let totalValue = 0;
    const byCategory: Record<string, { items: number; units: number; value: number }> = {};

    for (const item of stockResult.rows) {
      totalUnits += item.current_quantity;
      totalValue += parseFloat(item.stock_value || 0);

      const category = item.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = { items: 0, units: 0, value: 0 };
      }
      byCategory[category].items++;
      byCategory[category].units += item.current_quantity;
      byCategory[category].value += parseFloat(item.stock_value || 0);
    }

    return {
      totalItems: stockResult.rows.length,
      totalUnits,
      totalValue,
      byCategory,
      slowMoving: [], // Would need dispensing history
      fastMoving: [], // Would need dispensing history
    };
  }
}

// Export factory
export const createPharmacyInventoryService = (pool: Pool, tenantId: string) => {
  return new PharmacyInventoryService(pool, tenantId);
};
