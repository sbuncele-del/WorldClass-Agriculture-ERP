/**
 * Asset GL Posting Service
 * Creates journal entries for depreciation, disposals, revaluations, and impairments (IAS 16)
 */

import { PoolClient } from 'pg';

export interface DepreciationPostingParams {
  asset_id: string;
  period_year: number;
  period_month: number;
  depreciation_amount: number;
  depreciation_expense_account: string;
  accumulated_depreciation_account: string;
  cost_center_id?: string;
  department_id?: string;
}

export interface DisposalPostingParams {
  asset_id: string;
  disposal_date: Date;
  original_cost: number;
  accumulated_depreciation: number;
  net_book_value: number;
  sale_proceeds: number;
  removal_cost: number;
  disposal_method: string;
  asset_account: string;
  accumulated_depreciation_account: string;
  cash_account: string;
  gain_account: string;
  loss_account: string;
  cost_center_id?: string;
}

export interface RevaluationPostingParams {
  asset_id: string;
  valuation_date: Date;
  previous_book_value: number;
  revalued_amount: number;
  revaluation_surplus_account: string;
  asset_account: string;
  cost_center_id?: string;
}

export interface ImpairmentPostingParams {
  asset_id: string;
  impairment_date: Date;
  impairment_amount: number;
  previous_book_value: number;
  impairment_loss_account: string;
  accumulated_impairment_account: string;
  cost_center_id?: string;
}

export class AssetGLPostingService {
  /**
   * Create journal entry for monthly depreciation
   */
  static async postDepreciation(
    client: PoolClient,
    params: DepreciationPostingParams,
    userId: string = 'system'
  ): Promise<{ journal_entry_id: string; entry_number: string }> {
    const {
      asset_id,
      period_year,
      period_month,
      depreciation_amount,
      depreciation_expense_account,
      accumulated_depreciation_account,
      cost_center_id,
      department_id
    } = params;

    if (depreciation_amount <= 0) {
      throw new Error('Depreciation amount must be positive');
    }

    // Generate journal entry number
    const entryNumber = await this.generateEntryNumber(client, 'DEP');

    const description = `Depreciation for asset ${asset_id} - ${period_year}/${String(period_month).padStart(2, '0')}`;

    // Create journal entry header
    const headerResult = await client.query(`
      INSERT INTO journal_entries (
        entry_number, entry_date, entry_type, description,
        status, source_module, source_document_id, created_by
      ) VALUES ($1, $2, 'AUTO', $3, 'POSTED', 'ASSETS', $4, $5)
      RETURNING entry_id, entry_number
    `, [
      entryNumber,
      new Date(period_year, period_month - 1, 28), // End of month
      description,
      asset_id,
      userId
    ]);

    const journalEntryId = headerResult.rows[0].entry_id;

    // Debit: Depreciation Expense
    await client.query(`
      INSERT INTO journal_entry_lines (
        entry_id, line_number, account_code, description,
        debit_amount, credit_amount, cost_center_id, department_id
      ) VALUES ($1, 1, $2, $3, $4, 0, $5, $6)
    `, [
      journalEntryId,
      depreciation_expense_account,
      `Depreciation expense - ${period_year}/${period_month}`,
      depreciation_amount,
      cost_center_id,
      department_id
    ]);

    // Credit: Accumulated Depreciation
    await client.query(`
      INSERT INTO journal_entry_lines (
        entry_id, line_number, account_code, description,
        debit_amount, credit_amount, cost_center_id, department_id
      ) VALUES ($1, 2, $2, $3, 0, $4, $5, $6)
    `, [
      journalEntryId,
      accumulated_depreciation_account,
      `Accumulated depreciation - ${period_year}/${period_month}`,
      depreciation_amount,
      cost_center_id,
      department_id
    ]);

    return {
      journal_entry_id: journalEntryId,
      entry_number: entryNumber
    };
  }

  /**
   * Create journal entry for asset disposal (sale, scrapping, write-off)
   * IAS 16.67-72: Gain/loss on disposal
   */
  static async postDisposal(
    client: PoolClient,
    params: DisposalPostingParams,
    userId: string = 'system'
  ): Promise<{ journal_entry_id: string; entry_number: string; gain_loss: number }> {
    const {
      asset_id,
      disposal_date,
      original_cost,
      accumulated_depreciation,
      net_book_value,
      sale_proceeds,
      removal_cost,
      disposal_method,
      asset_account,
      accumulated_depreciation_account,
      cash_account,
      gain_account,
      loss_account,
      cost_center_id
    } = params;

    const net_proceeds = sale_proceeds - removal_cost;
    const gain_loss = net_proceeds - net_book_value;

    const entryNumber = await this.generateEntryNumber(client, 'DSP');
    const description = `Asset disposal (${disposal_method}) - Asset ${asset_id}`;

    // Create journal entry header
    const headerResult = await client.query(`
      INSERT INTO journal_entries (
        entry_number, entry_date, entry_type, description,
        status, source_module, source_document_id, created_by
      ) VALUES ($1, $2, 'AUTO', $3, 'POSTED', 'ASSETS', $4, $5)
      RETURNING entry_id, entry_number
    `, [entryNumber, disposal_date, description, asset_id, userId]);

    const journalEntryId = headerResult.rows[0].entry_id;
    let lineNumber = 0;

    // Debit: Accumulated Depreciation (remove contra account)
    if (accumulated_depreciation > 0) {
      lineNumber++;
      await client.query(`
        INSERT INTO journal_entry_lines (
          entry_id, line_number, account_code, description,
          debit_amount, credit_amount, cost_center_id
        ) VALUES ($1, $2, $3, $4, $5, 0, $6)
      `, [journalEntryId, lineNumber, accumulated_depreciation_account, 'Remove accumulated depreciation', accumulated_depreciation, cost_center_id]);
    }

    // Debit: Cash/Receivable (if proceeds > 0)
    if (net_proceeds > 0) {
      lineNumber++;
      await client.query(`
        INSERT INTO journal_entry_lines (
          entry_id, line_number, account_code, description,
          debit_amount, credit_amount, cost_center_id
        ) VALUES ($1, $2, $3, $4, $5, 0, $6)
      `, [journalEntryId, lineNumber, cash_account, `Proceeds from asset disposal`, net_proceeds, cost_center_id]);
    }

    // Debit: Loss on disposal (if loss)
    if (gain_loss < 0) {
      lineNumber++;
      await client.query(`
        INSERT INTO journal_entry_lines (
          entry_id, line_number, account_code, description,
          debit_amount, credit_amount, cost_center_id
        ) VALUES ($1, $2, $3, $4, $5, 0, $6)
      `, [journalEntryId, lineNumber, loss_account, 'Loss on disposal of asset', Math.abs(gain_loss), cost_center_id]);
    }

    // Credit: Asset (remove from books)
    lineNumber++;
    await client.query(`
      INSERT INTO journal_entry_lines (
        entry_id, line_number, account_code, description,
        debit_amount, credit_amount, cost_center_id
      ) VALUES ($1, $2, $3, $4, 0, $5, $6)
    `, [journalEntryId, lineNumber, asset_account, 'Remove asset cost', original_cost, cost_center_id]);

    // Credit: Gain on disposal (if gain)
    if (gain_loss > 0) {
      lineNumber++;
      await client.query(`
        INSERT INTO journal_entry_lines (
          entry_id, line_number, account_code, description,
          debit_amount, credit_amount, cost_center_id
        ) VALUES ($1, $2, $3, $4, 0, $5, $6)
      `, [journalEntryId, lineNumber, gain_account, 'Gain on disposal of asset', gain_loss, cost_center_id]);
    }

    return {
      journal_entry_id: journalEntryId,
      entry_number: entryNumber,
      gain_loss
    };
  }

  /**
   * Create journal entry for asset revaluation (IAS 16.31-42)
   * Upward revaluation goes to revaluation surplus (OCI)
   * Downward revaluation to P&L unless reversing previous surplus
   */
  static async postRevaluation(
    client: PoolClient,
    params: RevaluationPostingParams,
    userId: string = 'system'
  ): Promise<{ journal_entry_id: string; entry_number: string; surplus_or_deficit: number }> {
    const {
      asset_id,
      valuation_date,
      previous_book_value,
      revalued_amount,
      revaluation_surplus_account,
      asset_account,
      cost_center_id
    } = params;

    const revaluation_difference = revalued_amount - previous_book_value;

    if (revaluation_difference === 0) {
      throw new Error('No revaluation difference to post');
    }

    const entryNumber = await this.generateEntryNumber(client, 'RVL');
    const description = `Asset revaluation - Asset ${asset_id}`;

    const headerResult = await client.query(`
      INSERT INTO journal_entries (
        entry_number, entry_date, entry_type, description,
        status, source_module, source_document_id, created_by
      ) VALUES ($1, $2, 'AUTO', $3, 'POSTED', 'ASSETS', $4, $5)
      RETURNING entry_id, entry_number
    `, [entryNumber, valuation_date, description, asset_id, userId]);

    const journalEntryId = headerResult.rows[0].entry_id;

    if (revaluation_difference > 0) {
      // Upward revaluation: Debit Asset, Credit Revaluation Surplus
      await client.query(`
        INSERT INTO journal_entry_lines (entry_id, line_number, account_code, description, debit_amount, credit_amount, cost_center_id)
        VALUES ($1, 1, $2, 'Increase in asset carrying amount', $3, 0, $4)
      `, [journalEntryId, asset_account, revaluation_difference, cost_center_id]);

      await client.query(`
        INSERT INTO journal_entry_lines (entry_id, line_number, account_code, description, debit_amount, credit_amount, cost_center_id)
        VALUES ($1, 2, $2, 'Revaluation surplus (OCI)', 0, $3, $4)
      `, [journalEntryId, revaluation_surplus_account, revaluation_difference, cost_center_id]);
    } else {
      // Downward revaluation: Debit Revaluation Surplus/P&L, Credit Asset
      await client.query(`
        INSERT INTO journal_entry_lines (entry_id, line_number, account_code, description, debit_amount, credit_amount, cost_center_id)
        VALUES ($1, 1, $2, 'Decrease in revaluation surplus', $3, 0, $4)
      `, [journalEntryId, revaluation_surplus_account, Math.abs(revaluation_difference), cost_center_id]);

      await client.query(`
        INSERT INTO journal_entry_lines (entry_id, line_number, account_code, description, debit_amount, credit_amount, cost_center_id)
        VALUES ($1, 2, $2, 'Decrease in asset carrying amount', 0, $3, $4)
      `, [journalEntryId, asset_account, Math.abs(revaluation_difference), cost_center_id]);
    }

    return {
      journal_entry_id: journalEntryId,
      entry_number: entryNumber,
      surplus_or_deficit: revaluation_difference
    };
  }

  /**
   * Create journal entry for impairment loss (IAS 36)
   */
  static async postImpairment(
    client: PoolClient,
    params: ImpairmentPostingParams,
    userId: string = 'system'
  ): Promise<{ journal_entry_id: string; entry_number: string }> {
    const {
      asset_id,
      impairment_date,
      impairment_amount,
      impairment_loss_account,
      accumulated_impairment_account,
      cost_center_id
    } = params;

    if (impairment_amount <= 0) {
      throw new Error('Impairment amount must be positive');
    }

    const entryNumber = await this.generateEntryNumber(client, 'IMP');
    const description = `Impairment loss - Asset ${asset_id}`;

    const headerResult = await client.query(`
      INSERT INTO journal_entries (
        entry_number, entry_date, entry_type, description,
        status, source_module, source_document_id, created_by
      ) VALUES ($1, $2, 'AUTO', $3, 'POSTED', 'ASSETS', $4, $5)
      RETURNING entry_id, entry_number
    `, [entryNumber, impairment_date, description, asset_id, userId]);

    const journalEntryId = headerResult.rows[0].entry_id;

    // Debit: Impairment Loss (P&L)
    await client.query(`
      INSERT INTO journal_entry_lines (entry_id, line_number, account_code, description, debit_amount, credit_amount, cost_center_id)
      VALUES ($1, 1, $2, 'Impairment loss recognized', $3, 0, $4)
    `, [journalEntryId, impairment_loss_account, impairment_amount, cost_center_id]);

    // Credit: Accumulated Impairment (contra asset)
    await client.query(`
      INSERT INTO journal_entry_lines (entry_id, line_number, account_code, description, debit_amount, credit_amount, cost_center_id)
      VALUES ($1, 2, $2, 'Accumulated impairment', 0, $3, $4)
    `, [journalEntryId, accumulated_impairment_account, impairment_amount, cost_center_id]);

    return {
      journal_entry_id: journalEntryId,
      entry_number: entryNumber
    };
  }

  /**
   * Generate sequential entry number with prefix
   */
  private static async generateEntryNumber(client: PoolClient, prefix: string): Promise<string> {
    const result = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_number
      FROM journal_entries WHERE entry_number LIKE $1
    `, [`${prefix}-%`]);

    return `${prefix}-${String(result.rows[0].next_number).padStart(6, '0')}`;
  }
}

export default AssetGLPostingService;
