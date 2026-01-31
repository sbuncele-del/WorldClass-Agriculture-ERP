/**
 * Asset Management Models
 * TypeScript interfaces for fixed assets, depreciation, and related entities
 */

// =====================================================
// ENUMS
// =====================================================

export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  REDUCING_BALANCE = 'REDUCING_BALANCE',
  UNITS_OF_PRODUCTION = 'UNITS_OF_PRODUCTION'
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  DISPOSED = 'DISPOSED',
  WRITTEN_OFF = 'WRITTEN_OFF'
}

export enum AcquisitionMethod {
  PURCHASE = 'PURCHASE',
  LEASE = 'LEASE',
  DONATION = 'DONATION',
  CONSTRUCTION = 'CONSTRUCTION',
  TRANSFER_IN = 'TRANSFER_IN'
}

export enum DisposalMethod {
  SOLD = 'SOLD',
  SCRAPPED = 'SCRAPPED',
  DONATED = 'DONATED',
  TRADE_IN = 'TRADE_IN',
  STOLEN = 'STOLEN',
  LOST = 'LOST',
  WRITTEN_OFF = 'WRITTEN_OFF'
}

export enum ConditionRating {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR'
}

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  PREDICTIVE = 'PREDICTIVE',
  BREAKDOWN = 'BREAKDOWN',
  INSPECTION = 'INSPECTION'
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TransferType {
  LOCATION = 'LOCATION',
  DEPARTMENT = 'DEPARTMENT',
  COST_CENTER = 'COST_CENTER',
  CUSTODIAN = 'CUSTODIAN',
  MULTIPLE = 'MULTIPLE'
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

// =====================================================
// INTERFACES
// =====================================================

export interface AssetCategory {
  category_id: string;
  category_code: string;
  category_name: string;
  description?: string;
  parent_category_id?: string;
  
  // Default depreciation settings
  default_depreciation_method?: DepreciationMethod;
  default_useful_life_years?: number;
  default_residual_value_percent?: number;
  default_depreciation_rate?: number;
  
  // GL Account linking
  asset_gl_account_code?: string;
  accumulated_depreciation_gl_account_code?: string;
  depreciation_expense_gl_account_code?: string;
  disposal_gain_gl_account_code?: string;
  disposal_loss_gl_account_code?: string;
  
  // Settings
  is_depreciable: boolean;
  requires_insurance: boolean;
  requires_maintenance: boolean;
  is_active: boolean;
  
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface FixedAsset {
  asset_id: string;
  asset_number: string;
  asset_name: string;
  description?: string;
  category_id?: string;
  
  // Acquisition
  acquisition_date: Date;
  acquisition_method?: AcquisitionMethod;
  vendor_id?: string;
  vendor_name?: string;
  purchase_order_id?: string;
  invoice_number?: string;
  
  // Cost tracking
  acquisition_cost: number;
  installation_cost: number;
  improvement_cost: number;
  total_cost: number; // Calculated field
  
  // Depreciation configuration
  depreciation_method: DepreciationMethod;
  useful_life_years?: number;
  useful_life_units?: number;
  residual_value: number;
  depreciation_rate?: number;
  
  // Depreciation tracking
  depreciation_start_date?: Date;
  accumulated_depreciation: number;
  net_book_value: number; // Calculated field
  last_depreciation_date?: Date;
  total_units_produced: number;
  
  // Physical details
  serial_number?: string;
  manufacturer?: string;
  model_number?: string;
  year_of_manufacture?: number;
  warranty_expiry_date?: Date;
  
  // Location & assignment
  location_id?: string;
  location_name?: string;
  department_id?: string;
  cost_center_id?: string;
  custodian_employee_id?: string;
  custodian_name?: string;
  
  // Status
  asset_status: AssetStatus;
  condition_rating?: ConditionRating;
  
  // Insurance
  is_insured: boolean;
  insurance_policy_number?: string;
  insurance_value?: number;
  insurance_expiry_date?: Date;
  
  // Disposal
  disposal_date?: Date;
  disposal_method?: DisposalMethod;
  disposal_proceeds?: number;
  disposal_cost?: number;
  disposal_gain_loss?: number;
  
  // GL Accounts
  asset_gl_account_code?: string;
  accumulated_depreciation_gl_account_code?: string;
  depreciation_expense_gl_account_code?: string;
  
  // Additional
  notes?: string;
  photo_url?: string;
  qr_code?: string;
  
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface AssetDepreciationSchedule {
  schedule_id: string;
  asset_id: string;
  
  // Period
  period_year: number;
  period_month: number;
  period_start_date: Date;
  period_end_date: Date;
  
  // Depreciation calculation
  opening_book_value: number;
  depreciation_amount: number;
  accumulated_depreciation: number;
  closing_book_value: number;
  
  // Units of production
  units_produced_in_period?: number;
  
  // Posting
  is_posted: boolean;
  journal_entry_id?: string;
  posted_date?: Date;
  posted_by?: string;
  
  created_at: Date;
  created_by?: string;
}

export interface AssetDisposal {
  disposal_id: string;
  asset_id: string;
  
  // Disposal details
  disposal_date: Date;
  disposal_method: DisposalMethod;
  disposal_reason?: string;
  
  // Financial details at disposal
  original_cost: number;
  accumulated_depreciation: number;
  net_book_value: number;
  
  // Proceeds & costs
  sale_proceeds: number;
  removal_cost: number;
  net_proceeds: number; // Calculated
  gain_loss: number; // Calculated
  
  // Buyer details
  buyer_name?: string;
  buyer_contact?: string;
  invoice_number?: string;
  
  // Approval
  approved_by?: string;
  approval_date?: Date;
  approval_notes?: string;
  
  // Posting
  is_posted: boolean;
  journal_entry_id?: string;
  posted_date?: Date;
  posted_by?: string;
  
  created_at: Date;
  created_by?: string;
}

export interface AssetTransfer {
  transfer_id: string;
  asset_id: string;
  
  // Transfer details
  transfer_date: Date;
  transfer_type: TransferType;
  transfer_reason?: string;
  
  // From details
  from_location_id?: string;
  from_location_name?: string;
  from_department_id?: string;
  from_department_name?: string;
  from_cost_center_id?: string;
  from_cost_center_name?: string;
  from_custodian_id?: string;
  from_custodian_name?: string;
  
  // To details
  to_location_id?: string;
  to_location_name?: string;
  to_department_id?: string;
  to_department_name?: string;
  to_cost_center_id?: string;
  to_cost_center_name?: string;
  to_custodian_id?: string;
  to_custodian_name?: string;
  
  // Approval
  requested_by?: string;
  approved_by?: string;
  approval_date?: Date;
  
  // Condition
  condition_at_transfer?: ConditionRating;
  notes?: string;
  
  // Status
  transfer_status: TransferStatus;
  completed_date?: Date;
  
  created_at: Date;
  created_by?: string;
}

export interface AssetMaintenance {
  maintenance_id: string;
  asset_id: string;
  
  // Maintenance details
  maintenance_type: MaintenanceType;
  maintenance_date: Date;
  scheduled_date?: Date;
  completed_date?: Date;
  
  // Description
  maintenance_description: string;
  work_performed?: string;
  parts_replaced?: string;
  
  // Cost tracking
  labor_cost: number;
  parts_cost: number;
  other_cost: number;
  total_cost: number; // Calculated
  
  // Service provider
  service_provider_type?: string;
  service_provider_name?: string;
  technician_name?: string;
  service_invoice_number?: string;
  
  // Downtime
  downtime_hours?: number;
  
  // Next maintenance
  next_maintenance_date?: Date;
  next_maintenance_type?: string;
  
  // Status
  maintenance_status: MaintenanceStatus;
  priority?: string;
  
  // Capitalization
  is_capitalized: boolean;
  approved_for_capitalization_by?: string;
  
  notes?: string;
  
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface AssetValuation {
  valuation_id: string;
  asset_id: string;
  
  // Valuation details
  valuation_date: Date;
  valuation_method: string;
  valuation_reason?: string;
  
  // Valuer information
  valued_by?: string;
  valuer_credentials?: string;
  valuation_certificate_number?: string;
  
  // Values
  previous_book_value: number;
  revalued_amount: number;
  revaluation_gain_loss: number; // Calculated
  
  // Posting
  is_posted: boolean;
  journal_entry_id?: string;
  posted_date?: Date;
  posted_by?: string;
  
  // Approval
  approved_by?: string;
  approval_date?: Date;
  approval_notes?: string;
  
  // Supporting documents
  valuation_report_url?: string;
  notes?: string;
  
  created_at: Date;
  created_by?: string;
}

// =====================================================
// DTOs (Data Transfer Objects)
// =====================================================

export interface CreateAssetCategoryDTO {
  category_code: string;
  category_name: string;
  description?: string;
  parent_category_id?: string;
  default_depreciation_method?: DepreciationMethod;
  default_useful_life_years?: number;
  default_residual_value_percent?: number;
  default_depreciation_rate?: number;
  asset_gl_account_code?: string;
  accumulated_depreciation_gl_account_code?: string;
  depreciation_expense_gl_account_code?: string;
  disposal_gain_gl_account_code?: string;
  disposal_loss_gl_account_code?: string;
  is_depreciable?: boolean;
  requires_insurance?: boolean;
  requires_maintenance?: boolean;
}

export interface CreateFixedAssetDTO {
  asset_name: string;
  description?: string;
  category_id?: string;
  acquisition_date: Date | string;
  acquisition_method?: AcquisitionMethod;
  vendor_id?: string;
  vendor_name?: string;
  purchase_order_id?: string;
  invoice_number?: string;
  acquisition_cost: number;
  installation_cost?: number;
  improvement_cost?: number;
  depreciation_method: DepreciationMethod;
  useful_life_years?: number;
  useful_life_units?: number;
  residual_value?: number;
  depreciation_rate?: number;
  depreciation_start_date?: Date | string;
  serial_number?: string;
  manufacturer?: string;
  model_number?: string;
  year_of_manufacture?: number;
  warranty_expiry_date?: Date | string;
  location_id?: string;
  location_name?: string;
  department_id?: string;
  cost_center_id?: string;
  custodian_employee_id?: string;
  custodian_name?: string;
  condition_rating?: ConditionRating;
  is_insured?: boolean;
  insurance_policy_number?: string;
  insurance_value?: number;
  insurance_expiry_date?: Date | string;
  notes?: string;
}

export interface UpdateFixedAssetDTO {
  asset_name?: string;
  description?: string;
  category_id?: string;
  location_id?: string;
  location_name?: string;
  department_id?: string;
  cost_center_id?: string;
  custodian_employee_id?: string;
  custodian_name?: string;
  asset_status?: AssetStatus;
  condition_rating?: ConditionRating;
  is_insured?: boolean;
  insurance_policy_number?: string;
  insurance_value?: number;
  insurance_expiry_date?: Date | string;
  notes?: string;
}

export interface CreateAssetDisposalDTO {
  asset_id: string;
  disposal_date: Date | string;
  disposal_method: DisposalMethod;
  disposal_reason?: string;
  sale_proceeds?: number;
  removal_cost?: number;
  buyer_name?: string;
  buyer_contact?: string;
  invoice_number?: string;
  approved_by?: string;
  approval_date?: Date | string;
  approval_notes?: string;
}

export interface CreateAssetTransferDTO {
  asset_id: string;
  transfer_date: Date | string;
  transfer_type: TransferType;
  transfer_reason?: string;
  to_location_id?: string;
  to_location_name?: string;
  to_department_id?: string;
  to_department_name?: string;
  to_cost_center_id?: string;
  to_cost_center_name?: string;
  to_custodian_id?: string;
  to_custodian_name?: string;
  condition_at_transfer?: ConditionRating;
  notes?: string;
}

export interface CreateAssetMaintenanceDTO {
  asset_id: string;
  maintenance_type: MaintenanceType;
  maintenance_date: Date | string;
  scheduled_date?: Date | string;
  maintenance_description: string;
  work_performed?: string;
  parts_replaced?: string;
  labor_cost?: number;
  parts_cost?: number;
  other_cost?: number;
  service_provider_type?: string;
  service_provider_name?: string;
  technician_name?: string;
  service_invoice_number?: string;
  downtime_hours?: number;
  next_maintenance_date?: Date | string;
  next_maintenance_type?: string;
  priority?: string;
  is_capitalized?: boolean;
  notes?: string;
}

export interface DepreciationCalculationParams {
  acquisition_cost: number;
  residual_value: number;
  useful_life_years?: number;
  useful_life_units?: number;
  depreciation_rate?: number;
  accumulated_depreciation: number;
  current_book_value: number;
  period_year: number;
  period_month: number;
  units_produced_in_period?: number;
}

export interface DepreciationCalculationResult {
  depreciation_amount: number;
  accumulated_depreciation: number;
  closing_book_value: number;
}
