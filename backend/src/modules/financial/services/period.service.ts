/**
 * Period Management Service
 * Business logic for fiscal years and accounting periods
 */

import { query } from '../../../config/database';
import {
  FiscalYear,
  AccountingPeriod,
  CreateFiscalYearDTO,
  CreatePeriodDTO,
  FiscalYearWithPeriods,
  PeriodSummary,
  PeriodValidation,
  PeriodStatus
} from '../models/period.model';

export class PeriodService {
  
  // ===== FISCAL YEARS =====

  async getAllFiscalYears(): Promise<FiscalYear[]> {
    const sql = `
      SELECT * FROM fiscal_years
      ORDER BY start_date DESC
    `;
    const result = await query(sql);
    return result.rows;
  }

  async getFiscalYearById(id: string): Promise<FiscalYear | null> {
    const sql = 'SELECT * FROM fiscal_years WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async getFiscalYearByCode(code: string): Promise<FiscalYear | null> {
    const sql = 'SELECT * FROM fiscal_years WHERE year_code = $1';
    const result = await query(sql, [code]);
    return result.rows[0] || null;
  }

  async getCurrentFiscalYear(): Promise<FiscalYear | null> {
    const sql = 'SELECT * FROM fiscal_years WHERE is_current = true LIMIT 1';
    const result = await query(sql);
    return result.rows[0] || null;
  }

  async createFiscalYear(data: CreateFiscalYearDTO): Promise<string> {
    const sql = `
      INSERT INTO fiscal_years (
        year_code, year_name, start_date, end_date,
        number_of_periods, period_type, description,
        status, is_current, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', false, $8)
      RETURNING id
    `;
    
    const result = await query(sql, [
      data.year_code,
      data.year_name,
      data.start_date,
      data.end_date,
      data.number_of_periods,
      data.period_type,
      data.description || null,
      data.user_id
    ]);
    
    return result.rows[0].id;
  }

  async setCurrentFiscalYear(year_id: string, user_id: string): Promise<void> {
    // First, unset all current years
    await query('UPDATE fiscal_years SET is_current = false, updated_by = $1 WHERE is_current = true', [user_id]);
    
    // Then set the specified year as current
    await query('UPDATE fiscal_years SET is_current = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [user_id, year_id]);
  }

  async closeFiscalYear(year_id: string, user_id: string): Promise<void> {
    // Validate all periods are closed
    const openPeriodsCheck = await query(
      'SELECT COUNT(*) as count FROM accounting_periods WHERE fiscal_year_id = $1 AND status != $2',
      [year_id, 'CLOSED']
    );
    
    if (parseInt(openPeriodsCheck.rows[0].count) > 0) {
      throw new Error('Cannot close fiscal year: some periods are still open');
    }

    const sql = `
      UPDATE fiscal_years 
      SET status = 'CLOSED', 
          closed_at = CURRENT_TIMESTAMP,
          closed_by = $1,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
      WHERE id = $2
    `;
    
    await query(sql, [user_id, year_id]);
  }

  // ===== ACCOUNTING PERIODS =====

  async getAllPeriods(fiscal_year_id?: string): Promise<AccountingPeriod[]> {
    let sql = 'SELECT * FROM accounting_periods';
    const params: string[] = [];
    
    if (fiscal_year_id) {
      sql += ' WHERE fiscal_year_id = $1';
      params.push(fiscal_year_id);
    }
    
    sql += ' ORDER BY period_number ASC';
    
    const result = await query(sql, params);
    return result.rows;
  }

  async getPeriodById(id: string): Promise<AccountingPeriod | null> {
    const sql = 'SELECT * FROM accounting_periods WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async getPeriodByCode(code: string): Promise<AccountingPeriod | null> {
    const sql = 'SELECT * FROM accounting_periods WHERE period_code = $1';
    const result = await query(sql, [code]);
    return result.rows[0] || null;
  }

  async getCurrentPeriod(): Promise<AccountingPeriod | null> {
    const sql = 'SELECT * FROM accounting_periods WHERE is_current = true LIMIT 1';
    const result = await query(sql);
    return result.rows[0] || null;
  }

  async getOpenPeriods(fiscal_year_id?: string): Promise<AccountingPeriod[]> {
    let sql = 'SELECT * FROM accounting_periods WHERE status = $1';
    const params: (string | PeriodStatus)[] = ['OPEN'];
    
    if (fiscal_year_id) {
      sql += ' AND fiscal_year_id = $2';
      params.push(fiscal_year_id);
    }
    
    sql += ' ORDER BY period_number ASC';
    
    const result = await query(sql, params);
    return result.rows;
  }

  async createPeriod(data: CreatePeriodDTO): Promise<string> {
    const sql = `
      INSERT INTO accounting_periods (
        fiscal_year_id, period_number, period_code, period_name,
        start_date, end_date, status, is_adjustment_period,
        description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'FUTURE', $7, $8, $9)
      RETURNING id
    `;
    
    const result = await query(sql, [
      data.fiscal_year_id,
      data.period_number,
      data.period_code,
      data.period_name,
      data.start_date,
      data.end_date,
      data.is_adjustment_period || false,
      data.description || null,
      data.user_id
    ]);
    
    return result.rows[0].id;
  }

  async openPeriod(period_id: string, user_id: string): Promise<void> {
    const period = await this.getPeriodById(period_id);
    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status === 'LOCKED') {
      throw new Error('Cannot open a locked period');
    }

    if (period.status === 'OPEN') {
      throw new Error('Period is already open');
    }

    const sql = `
      UPDATE accounting_periods 
      SET status = 'OPEN',
          opened_at = CURRENT_TIMESTAMP,
          opened_by = $1,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
      WHERE id = $2
    `;
    
    await query(sql, [user_id, period_id]);
  }

  async closePeriod(period_id: string, user_id: string, force: boolean = false): Promise<void> {
    const period = await this.getPeriodById(period_id);
    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status === 'LOCKED') {
      throw new Error('Cannot close a locked period');
    }

    if (period.status === 'CLOSED') {
      throw new Error('Period is already closed');
    }

    // Validate no unposted entries (unless force)
    if (!force) {
      const validation = await this.validatePeriodClose(period_id);
      if (!validation.can_close) {
        throw new Error(`Cannot close period: ${validation.errors.join(', ')}`);
      }
    }

    const sql = `
      UPDATE accounting_periods 
      SET status = 'CLOSED',
          closed_at = CURRENT_TIMESTAMP,
          closed_by = $1,
          is_current = false,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
      WHERE id = $2
    `;
    
    await query(sql, [user_id, period_id]);

    // Auto-open next period if it exists
    await this.autoOpenNextPeriod(period);
  }

  async lockPeriod(period_id: string, user_id: string): Promise<void> {
    const period = await this.getPeriodById(period_id);
    if (!period) {
      throw new Error('Period not found');
    }

    if (period.status !== 'CLOSED') {
      throw new Error('Period must be closed before locking');
    }

    const sql = `
      UPDATE accounting_periods 
      SET status = 'LOCKED',
          locked_at = CURRENT_TIMESTAMP,
          locked_by = $1,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
      WHERE id = $2
    `;
    
    await query(sql, [user_id, period_id]);
  }

  async setCurrentPeriod(period_id: string, user_id: string): Promise<void> {
    // First, unset all current periods
    await query('UPDATE accounting_periods SET is_current = false, updated_by = $1 WHERE is_current = true', [user_id]);
    
    // Then set the specified period as current
    await query('UPDATE accounting_periods SET is_current = true, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [user_id, period_id]);
  }

  // ===== VALIDATION & UTILITIES =====

  async validatePeriodClose(period_id: string): Promise<PeriodValidation> {
    const validation: PeriodValidation = {
      can_open: false,
      can_close: true,
      can_lock: false,
      warnings: [],
      errors: [],
      pending_transactions: 0,
      unposted_entries: 0
    };

    // Check for unposted journal entries in this period
    const unpostedQuery = `
      SELECT COUNT(*) as count 
      FROM journal_entries 
      WHERE posting_date >= (SELECT start_date FROM accounting_periods WHERE id = $1)
      AND posting_date <= (SELECT end_date FROM accounting_periods WHERE id = $1)
      AND status != 'POSTED'
    `;
    
    const unpostedResult = await query(unpostedQuery, [period_id]);
    validation.unposted_entries = parseInt(unpostedResult.rows[0].count);

    if (validation.unposted_entries > 0) {
      validation.errors.push(`${validation.unposted_entries} unposted journal entries found`);
      validation.can_close = false;
    }

    return validation;
  }

  private async autoOpenNextPeriod(closedPeriod: AccountingPeriod): Promise<void> {
    const nextPeriodQuery = `
      SELECT * FROM accounting_periods 
      WHERE fiscal_year_id = $1 
      AND period_number = $2
      AND status = 'FUTURE'
    `;
    
    const result = await query(nextPeriodQuery, [
      closedPeriod.fiscal_year_id,
      closedPeriod.period_number + 1
    ]);

    if (result.rows.length > 0) {
      const nextPeriod = result.rows[0];
      await this.openPeriod(nextPeriod.id, 'system');
      await this.setCurrentPeriod(nextPeriod.id, 'system');
    }
  }

  async getFiscalYearWithPeriods(year_id: string): Promise<FiscalYearWithPeriods | null> {
    const fiscalYear = await this.getFiscalYearById(year_id);
    if (!fiscalYear) {
      return null;
    }

    const periods = await this.getAllPeriods(year_id);

    return {
      ...fiscalYear,
      periods
    };
  }

  async getPeriodSummary(): Promise<PeriodSummary> {
    const fiscalYearsCount = await query('SELECT COUNT(*) as count FROM fiscal_years');
    const totalPeriods = await query('SELECT COUNT(*) as count FROM accounting_periods');
    const openPeriods = await query('SELECT COUNT(*) as count FROM accounting_periods WHERE status = $1', ['OPEN']);
    const closedPeriods = await query('SELECT COUNT(*) as count FROM accounting_periods WHERE status = $1', ['CLOSED']);
    const futurePeriods = await query('SELECT COUNT(*) as count FROM accounting_periods WHERE status = $1', ['FUTURE']);
    const lockedPeriods = await query('SELECT COUNT(*) as count FROM accounting_periods WHERE status = $1', ['LOCKED']);
    
    const currentPeriod = await this.getCurrentPeriod();
    const currentFiscalYear = await this.getCurrentFiscalYear();

    return {
      fiscal_years: parseInt(fiscalYearsCount.rows[0].count),
      total_periods: parseInt(totalPeriods.rows[0].count),
      open_periods: parseInt(openPeriods.rows[0].count),
      closed_periods: parseInt(closedPeriods.rows[0].count),
      future_periods: parseInt(futurePeriods.rows[0].count),
      locked_periods: parseInt(lockedPeriods.rows[0].count),
      current_period: currentPeriod,
      current_fiscal_year: currentFiscalYear
    };
  }
}
