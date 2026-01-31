/**
 * Logistics Fuel Controller V2
 * 
 * Tenant-hardened fuel transaction management with automatic GL integration
 * Creates double-entry accounting records for fuel purchases
 */

import { Request, Response } from 'express';
import pool from '../../config/database';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  return { tenantId, userId: userId || '' };
}

/**
 * POST /api/v2/logistics/fuel/transactions
 * Log a fuel transaction and create journal entry (tenant-scoped)
 */
export async function createFuelTransaction(req: TenantRequest, res: Response): Promise<void> {
  const client = await pool.connect();

  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      date,
      vehicle,
      driver,
      litres,
      pricePerLitre,
      cost,
      odometer,
      supplier,
      invoiceNumber,
      notes
    } = req.body;

    // Validate required fields
    if (!date || !vehicle || !litres || !cost || !supplier) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: date, vehicle, litres, cost, supplier'
      });
      return;
    }

    await client.query('BEGIN');

    // 1. Create fuel transaction record
    const fuelResult = await client.query(`
      INSERT INTO logistics.fuel_transactions (
        tenant_id,
        transaction_date,
        vehicle_id,
        driver_id,
        litres,
        price_per_litre,
        total_cost,
        odometer_reading,
        supplier,
        invoice_number,
        notes,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING transaction_id
    `, [tenantId, date, vehicle, driver, litres, pricePerLitre, cost, odometer, supplier, invoiceNumber, notes, userId]);

    const transactionId = fuelResult.rows[0].transaction_id;

    // 2. Get or create supplier account in chart of accounts
    let supplierAccount = await client.query(`
      SELECT account_id, account_code 
      FROM chart_of_accounts 
      WHERE tenant_id = $1 
        AND account_name = $2 
        AND account_type = 'Liability'
    `, [tenantId, `Accounts Payable - ${supplier}`]);

    let supplierAccountId: string;
    let supplierAccountCode: string;

    if (supplierAccount.rows.length === 0) {
      // Create supplier account if it doesn't exist
      const newSupplierAccount = await client.query(`
        INSERT INTO chart_of_accounts (
          tenant_id,
          account_code,
          account_name,
          account_type,
          parent_account_id,
          is_active,
          created_by,
          created_at
        )
        VALUES (
          $1,
          (SELECT '2-10-' || LPAD((
            SELECT COUNT(*) + 1 
            FROM chart_of_accounts 
            WHERE tenant_id = $1 AND account_code LIKE '2-10-%'
          )::text, 3, '0')),
          $2,
          'Liability',
          (SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND account_code = '2-10' LIMIT 1),
          true,
          $3,
          NOW()
        )
        RETURNING account_id, account_code
      `, [tenantId, `Accounts Payable - ${supplier}`, userId]);

      supplierAccountId = newSupplierAccount.rows[0].account_id;
      supplierAccountCode = newSupplierAccount.rows[0].account_code;
    } else {
      supplierAccountId = supplierAccount.rows[0].account_id;
      supplierAccountCode = supplierAccount.rows[0].account_code;
    }

    // 3. Get or create Fuel Expense account (5-20-001)
    let fuelExpenseAccount = await client.query(`
      SELECT account_id, account_code 
      FROM chart_of_accounts 
      WHERE tenant_id = $1 AND account_code = '5-20-001'
      LIMIT 1
    `, [tenantId]);

    let fuelExpenseAccountId: string;

    if (fuelExpenseAccount.rows.length === 0) {
      const newFuelExpenseAccount = await client.query(`
        INSERT INTO chart_of_accounts (
          tenant_id,
          account_code,
          account_name,
          account_type,
          parent_account_id,
          is_active,
          created_by,
          created_at
        )
        VALUES (
          $1,
          '5-20-001',
          'Fuel Expense',
          'Expense',
          (SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND account_code = '5-20' LIMIT 1),
          true,
          $2,
          NOW()
        )
        RETURNING account_id
      `, [tenantId, userId]);
      fuelExpenseAccountId = newFuelExpenseAccount.rows[0].account_id;
    } else {
      fuelExpenseAccountId = fuelExpenseAccount.rows[0].account_id;
    }

    // 4. Create journal entry
    const journalResult = await client.query(`
      INSERT INTO journal_entries (
        tenant_id,
        entry_date,
        description,
        reference,
        source_module,
        source_id,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, 'logistics_fuel', $5, $6, NOW())
      RETURNING entry_id
    `, [tenantId, date, `Fuel purchase - ${vehicle} at ${supplier}`, `FT-${transactionId}`, transactionId, userId]);

    const journalEntryId = journalResult.rows[0].entry_id;

    // 5. Create journal entry lines (Double-entry bookkeeping)
    
    // Debit: Fuel Expense
    await client.query(`
      INSERT INTO journal_entry_lines (
        entry_id,
        account_id,
        debit_amount,
        credit_amount,
        description,
        created_at
      ) VALUES ($1, $2, $3, 0, $4, NOW())
    `, [journalEntryId, fuelExpenseAccountId, cost, `Fuel: ${litres}L @ R${pricePerLitre}/L`]);

    // Credit: Accounts Payable - Supplier
    await client.query(`
      INSERT INTO journal_entry_lines (
        entry_id,
        account_id,
        debit_amount,
        credit_amount,
        description,
        created_at
      ) VALUES ($1, $2, 0, $3, $4, NOW())
    `, [journalEntryId, supplierAccountId, cost, `Invoice: ${invoiceNumber}`]);

    // 6. Update fuel transaction with journal entry reference
    await client.query(`
      UPDATE logistics.fuel_transactions 
      SET journal_entry_id = $1 
      WHERE transaction_id = $2 AND tenant_id = $3
    `, [journalEntryId, transactionId, tenantId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        transactionId,
        journalEntryId,
        accountingEntries: {
          debit: {
            account: '5-20-001',
            accountName: 'Fuel Expense',
            amount: cost
          },
          credit: {
            account: supplierAccountCode,
            accountName: `Accounts Payable - ${supplier}`,
            amount: cost
          }
        }
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[FuelV2] Create transaction error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create fuel transaction' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/v2/logistics/fuel/transactions
 * Get all fuel transactions (tenant-scoped)
 */
export async function listFuelTransactions(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { vehicle, driver, supplier, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        t.transaction_id,
        t.transaction_date,
        t.vehicle_id,
        v.registration as vehicle_reg,
        t.driver_id,
        d.first_name || ' ' || d.last_name as driver_name,
        t.litres,
        t.price_per_litre,
        t.total_cost,
        t.odometer_reading,
        t.supplier,
        t.invoice_number,
        t.notes,
        t.journal_entry_id,
        t.created_at
      FROM logistics.fuel_transactions t
      LEFT JOIN logistics.vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN logistics.drivers d ON t.driver_id = d.driver_id
      WHERE t.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 2;

    if (vehicle) {
      query += ` AND (t.vehicle_id = $${paramCount} OR v.registration ILIKE $${paramCount + 1})`;
      params.push(vehicle, `%${vehicle}%`);
      paramCount += 2;
    }

    if (driver) {
      query += ` AND t.driver_id = $${paramCount}`;
      params.push(driver);
      paramCount++;
    }

    if (supplier) {
      query += ` AND t.supplier ILIKE $${paramCount}`;
      params.push(`%${supplier}%`);
      paramCount++;
    }

    if (startDate) {
      query += ` AND t.transaction_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND t.transaction_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM logistics.fuel_transactions WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[FuelV2] List transactions error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch fuel transactions' });
  }
}

/**
 * GET /api/v2/logistics/fuel/transactions/:id
 * Get single fuel transaction (tenant-scoped)
 */
export async function getFuelTransaction(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        t.*,
        v.registration as vehicle_reg,
        d.first_name || ' ' || d.last_name as driver_name,
        je.entry_date,
        je.description as journal_description
      FROM logistics.fuel_transactions t
      LEFT JOIN logistics.vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN logistics.drivers d ON t.driver_id = d.driver_id
      LEFT JOIN journal_entries je ON t.journal_entry_id = je.entry_id
      WHERE t.transaction_id = $1 AND t.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('[FuelV2] Get transaction error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
}

/**
 * DELETE /api/v2/logistics/fuel/transactions/:id
 * Delete fuel transaction and reverse journal entry (tenant-scoped)
 */
export async function deleteFuelTransaction(req: TenantRequest, res: Response): Promise<void> {
  const client = await pool.connect();

  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    await client.query('BEGIN');

    // Get the transaction to find journal entry
    const txn = await client.query(
      `SELECT journal_entry_id FROM logistics.fuel_transactions WHERE transaction_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (txn.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    const journalEntryId = txn.rows[0].journal_entry_id;

    // Delete journal entry lines
    if (journalEntryId) {
      await client.query(`DELETE FROM journal_entry_lines WHERE entry_id = $1`, [journalEntryId]);
      await client.query(`DELETE FROM journal_entries WHERE entry_id = $1 AND tenant_id = $2`, [journalEntryId, tenantId]);
    }

    // Delete fuel transaction
    await client.query(
      `DELETE FROM logistics.fuel_transactions WHERE transaction_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    await client.query('COMMIT');

    res.json({ success: true, data: { message: 'Transaction and journal entries deleted' } });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[FuelV2] Delete transaction error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/v2/logistics/fuel/stats
 * Get fuel consumption statistics (tenant-scoped)
 */
export async function getFuelStats(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { period = '30' } = req.query;

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(litres) as total_litres,
        SUM(total_cost) as total_cost,
        AVG(price_per_litre) as avg_price_per_litre,
        COUNT(DISTINCT vehicle_id) as vehicles_fueled,
        COUNT(DISTINCT supplier) as suppliers_used
      FROM logistics.fuel_transactions
      WHERE tenant_id = $1 
        AND transaction_date >= CURRENT_DATE - INTERVAL '1 day' * $2
    `, [tenantId, parseInt(period as string)]);

    // Get top vehicles by consumption
    const topVehicles = await pool.query(`
      SELECT 
        t.vehicle_id,
        v.registration,
        SUM(t.litres) as total_litres,
        SUM(t.total_cost) as total_cost,
        COUNT(*) as fill_count
      FROM logistics.fuel_transactions t
      LEFT JOIN logistics.vehicles v ON t.vehicle_id = v.vehicle_id
      WHERE t.tenant_id = $1 
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * $2
      GROUP BY t.vehicle_id, v.registration
      ORDER BY SUM(t.litres) DESC
      LIMIT 5
    `, [tenantId, parseInt(period as string)]);

    // Get daily consumption trend
    const trend = await pool.query(`
      SELECT 
        DATE(transaction_date) as date,
        SUM(litres) as litres,
        SUM(total_cost) as cost
      FROM logistics.fuel_transactions
      WHERE tenant_id = $1 
        AND transaction_date >= CURRENT_DATE - INTERVAL '1 day' * $2
      GROUP BY DATE(transaction_date)
      ORDER BY DATE(transaction_date)
    `, [tenantId, parseInt(period as string)]);

    res.json({
      success: true,
      data: {
        summary: stats.rows[0],
        topVehicles: topVehicles.rows,
        dailyTrend: trend.rows,
        period: `Last ${period} days`
      }
    });
  } catch (error: any) {
    console.error('[FuelV2] Get stats error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch fuel statistics' });
  }
}

/**
 * POST /api/v2/logistics/fuel/reconcile
 * Reconcile fuel transactions with card statements (tenant-scoped)
 */
export async function reconcileFuelTransactions(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { transactionIds, statementReference } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      res.status(400).json({ success: false, error: 'transactionIds array required' });
      return;
    }

    const result = await pool.query(`
      UPDATE logistics.fuel_transactions
      SET 
        reconciled = true,
        reconciled_at = CURRENT_TIMESTAMP,
        reconciled_by = $1,
        statement_reference = $2
      WHERE transaction_id = ANY($3) AND tenant_id = $4
      RETURNING transaction_id
    `, [userId, statementReference, transactionIds, tenantId]);

    res.json({
      success: true,
      data: {
        reconciledCount: result.rows.length,
        transactionIds: result.rows.map(r => r.transaction_id)
      }
    });
  } catch (error: any) {
    console.error('[FuelV2] Reconcile error:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to reconcile transactions' });
  }
}
