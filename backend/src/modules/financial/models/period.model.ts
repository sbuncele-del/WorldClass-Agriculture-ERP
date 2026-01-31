/**
 * Period Management Models
 * TypeScript interfaces for fiscal years and accounting periods
 */

// ===== FISCAL YEAR =====

export interface FiscalYear {
  id: string;
  year_code: string;
  year_name: string;
  start_date: string;
  end_date: string;
  status: FiscalYearStatus;
  is_current: boolean;
  number_of_periods: number;
  period_type: PeriodType;
  description: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface CreateFiscalYearDTO {
  year_code: string;
  year_name: string;
  start_date: string;
  end_date: string;
  number_of_periods: number;
  period_type: PeriodType;
  description?: string;
  user_id: string;
}

export type FiscalYearStatus = 'OPEN' | 'CLOSED' | 'LOCKED';
export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'CUSTOM';

// ===== ACCOUNTING PERIOD =====

export interface AccountingPeriod {
  id: string;
  fiscal_year_id: string;
  period_number: number;
  period_code: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  is_current: boolean;
  is_adjustment_period: boolean;
  description: string | null;
  opened_at: string | null;
  opened_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

export interface CreatePeriodDTO {
  fiscal_year_id: string;
  period_number: number;
  period_code: string;
  period_name: string;
  start_date: string;
  end_date: string;
  is_adjustment_period?: boolean;
  description?: string;
  user_id: string;
}

export type PeriodStatus = 'FUTURE' | 'OPEN' | 'CLOSED' | 'LOCKED';

// ===== PERIOD ACTIONS =====

export interface OpenPeriodRequest {
  period_id: string;
  user_id: string;
}

export interface ClosePeriodRequest {
  period_id: string;
  user_id: string;
  force?: boolean; // Override validation checks
}

export interface LockPeriodRequest {
  period_id: string;
  user_id: string;
}

export interface YearEndCloseRequest {
  fiscal_year_id: string;
  new_fiscal_year_code: string;
  new_fiscal_year_name: string;
  new_start_date: string;
  new_end_date: string;
  transfer_balances: boolean;
  user_id: string;
}

// ===== PERIOD SUMMARY =====

export interface PeriodSummary {
  fiscal_years: number;
  total_periods: number;
  open_periods: number;
  closed_periods: number;
  future_periods: number;
  locked_periods: number;
  current_period: AccountingPeriod | null;
  current_fiscal_year: FiscalYear | null;
}

// ===== FISCAL YEAR WITH PERIODS =====

export interface FiscalYearWithPeriods extends FiscalYear {
  periods: AccountingPeriod[];
}

// ===== PERIOD VALIDATION =====

export interface PeriodValidation {
  can_open: boolean;
  can_close: boolean;
  can_lock: boolean;
  warnings: string[];
  errors: string[];
  pending_transactions: number;
  unposted_entries: number;
}
