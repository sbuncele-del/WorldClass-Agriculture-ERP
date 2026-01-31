import { Router, Request, Response } from 'express';
import pool from '../../config/database';

const router = Router();

/**
 * POST /api/logistics/fuel/transactions
 * Log a fuel transaction and automatically create journal entry
 * 
 * Creates accounting entries:
 * - Debit: Fuel Expense (Account 5-20-001)
 * - Credit: Accounts Payable - Supplier (Account 2-10-XXX)
 */
router.post('/transactions', async (req: Request, res: Response) => {
  const {
    date,
    vehicle,
    driver,
    litres,
    pricePerLitre,
    cost,
    odometer,
    supplier,
    invoiceNumber
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create fuel transaction record
    const fuelTransactionQuery = `
      INSERT INTO logistics_fuel_transactions (
        transaction_date,
        vehicle,
        driver,
        litres,
        price_per_litre,
        total_cost,
        odometer_reading,
        supplier,
        invoice_number,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING transaction_id
    `;

    const fuelResult = await client.query(fuelTransactionQuery, [
      date,
      vehicle,
      driver,
      litres,
      pricePerLitre,
      cost,
      odometer,
      supplier,
      invoiceNumber
    ]);

    const transactionId = fuelResult.rows[0].transaction_id;

    // 2. Get or create supplier account in chart of accounts
    let supplierAccountQuery = `
      SELECT account_id, account_code 
      FROM chart_of_accounts 
      WHERE account_name = $1 
      AND account_type = 'Liability'
    `;

    let supplierAccount = await client.query(supplierAccountQuery, [`Accounts Payable - ${supplier}`]);

    let supplierAccountId: string;
    let supplierAccountCode: string;

    if (supplierAccount.rows.length === 0) {
      // Create supplier account if it doesn't exist
      const createSupplierAccountQuery = `
        INSERT INTO chart_of_accounts (
          account_code,
          account_name,
          account_type,
          parent_account_id,
          is_active,
          created_at
        )
        VALUES (
          (SELECT '2-10-' || LPAD((
            SELECT COUNT(*) + 1 
            FROM chart_of_accounts 
            WHERE account_code LIKE '2-10-%'
          )::text, 3, '0')),
          $1,
          'Liability',
          (SELECT account_id FROM chart_of_accounts WHERE account_code = '2-10' LIMIT 1),
          true,
          NOW()
        )
        RETURNING account_id, account_code
      `;

      const newSupplierAccount = await client.query(createSupplierAccountQuery, [
        `Accounts Payable - ${supplier}`
      ]);

      supplierAccountId = newSupplierAccount.rows[0].account_id;
      supplierAccountCode = newSupplierAccount.rows[0].account_code;
    } else {
      supplierAccountId = supplierAccount.rows[0].account_id;
      supplierAccountCode = supplierAccount.rows[0].account_code;
    }

    // 3. Get Fuel Expense account (5-20-001)
    const fuelExpenseAccountQuery = `
      SELECT account_id, account_code 
      FROM chart_of_accounts 
      WHERE account_code = '5-20-001'
      LIMIT 1
    `;

    let fuelExpenseAccount = await client.query(fuelExpenseAccountQuery);

    let fuelExpenseAccountId: string;

    if (fuelExpenseAccount.rows.length === 0) {
      // Create Fuel Expense account if it doesn't exist
      const createFuelExpenseQuery = `
        INSERT INTO chart_of_accounts (
          account_code,
          account_name,
          account_type,
          parent_account_id,
          is_active,
          created_at
        )
        VALUES (
          '5-20-001',
          'Fuel Expense',
          'Expense',
          (SELECT account_id FROM chart_of_accounts WHERE account_code = '5-20' LIMIT 1),
          true,
          NOW()
        )
        RETURNING account_id
      `;

      const newFuelExpenseAccount = await client.query(createFuelExpenseQuery);
      fuelExpenseAccountId = newFuelExpenseAccount.rows[0].account_id;
    } else {
      fuelExpenseAccountId = fuelExpenseAccount.rows[0].account_id;
    }

    // 4. Create journal entry
    const journalEntryQuery = `
      INSERT INTO journal_entries (
        entry_date,
        description,
        reference,
        source_module,
        source_id,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, 'logistics_fuel', $4, $5, NOW())
      RETURNING entry_id
    `;

    const journalResult = await client.query(journalEntryQuery, [
      date,
      `Fuel purchase - ${vehicle} at ${supplier}`,
      `FT-${transactionId}`,
      transactionId,
      req.user?.user_id || 'system'
    ]);

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
    `, [
      journalEntryId,
      fuelExpenseAccountId,
      cost,
      `Fuel: ${litres}L @ R${pricePerLitre}/L`
    ]);

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
    `, [
      journalEntryId,
      supplierAccountId,
      cost,
      `Invoice: ${invoiceNumber}`
    ]);

    // 6. Update fuel transaction with journal entry reference
    await client.query(`
      UPDATE logistics_fuel_transactions 
      SET journal_entry_id = $1 
      WHERE transaction_id = $2
    `, [journalEntryId, transactionId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      transaction_id: transactionId,
      journal_entry_id: journalEntryId,
      accounting_entries: {
        debit: {
          account: '5-20-001',
          account_name: 'Fuel Expense',
          amount: cost
        },
        credit: {
          account: supplierAccountCode,
          account_name: `Accounts Payable - ${supplier}`,
          amount: cost
        }
      },
      message: 'Fuel transaction logged and journal entry created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating fuel transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fuel transaction and journal entry'
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/logistics/fuel/transactions
 * Get all fuel transactions with optional filters
 */
router.get('/transactions', async (req: Request, res: Response) => {
  const { vehicle, startDate, endDate } = req.query;

  try {
    let query = `
      SELECT 
        t.*,
        je.entry_id as journal_entry_id
      FROM logistics_fuel_transactions t
      LEFT JOIN journal_entries je ON t.journal_entry_id = je.entry_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (vehicle) {
      query += ` AND t.vehicle LIKE $${paramCount}`;
      params.push(`%${vehicle}%`);
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

    query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      transactions: result.rows
    });

  } catch (error) {
    console.error('Error fetching fuel transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuel transactions'
    });
  }
});

export default router;
