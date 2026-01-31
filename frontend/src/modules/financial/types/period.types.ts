/**
 * Period Management Types
 * Frontend interfaces matching backend models
 */

export const FiscalYearStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  LOCKED: 'LOCKED'
} as const;

export type FiscalYearStatus = typeof FiscalYearStatus[keyof typeof FiscalYearStatus];

export const PeriodStatus = {
  FUTURE: 'FUTURE',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  LOCKED: 'LOCKED'
} as const;

export type PeriodStatus = typeof PeriodStatus[keyof typeof PeriodStatus];

export const PeriodType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  CUSTOM: 'CUSTOM'
} as const;

export type PeriodType = typeof PeriodType[keyof typeof PeriodType];

export interface FiscalYear {
  id: string;
  year_code: string;
  description: string;
  start_date: string;
  end_date: string;
  status: FiscalYearStatus;
  is_current: boolean;
  period_type: PeriodType;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface AccountingPeriod {
  id: string;
  fiscal_year_id: string;
  period_code: string;
  period_number: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  is_current: boolean;
  is_adjustment_period: boolean;
  opened_at?: string;
  opened_by?: string;
  closed_at?: string;
  closed_by?: string;
  locked_at?: string;
  locked_by?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface FiscalYearWithPeriods extends FiscalYear {
  periods: AccountingPeriod[];
}

export interface PeriodSummary {
  total_periods: number;
  open_periods: number;
  closed_periods: number;
  locked_periods: number;
  future_periods: number;
  current_period?: AccountingPeriod;
  current_fiscal_year?: FiscalYear;
}

export interface PeriodValidation {
  can_close: boolean;
  blocking_issues: string[];
  warnings: string[];
  unposted_entries_count: number;
}

export interface CreateFiscalYearDTO {
  year_code: string;
  description: string;
  start_date: string;
  end_date: string;
  period_type: PeriodType;
  is_current?: boolean;
  user_id: string;
}

export interface CreatePeriodDTO {
  fiscal_year_id: string;
  period_code: string;
  period_number: number;
  period_name: string;
  start_date: string;
  end_date: string;
  is_adjustment_period?: boolean;
  user_id: string;
}
