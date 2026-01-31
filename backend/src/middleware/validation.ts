import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Input Validation Rules
 * 
 * Centralized validation rules for all endpoints
 * Prevents SQL injection, XSS, and invalid data
 */

// Authentication Validation
export const signupValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required (max 100 characters)')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required (max 100 characters)')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  body('companyName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name is required (max 255 characters)'),
  body('country')
    .optional()
    .isISO31661Alpha2()
    .withMessage('Country must be a valid ISO 3166-1 alpha-2 code'),
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const passwordResetRequestValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

export const passwordResetValidation: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Payment Validation
export const paymentSessionValidation: ValidationChain[] = [
  body('plan')
    .isIn(['trial', 'starter', 'professional', 'enterprise'])
    .withMessage('Valid plan is required'),
  body('billingCycle')
    .isIn(['monthly', 'annual'])
    .withMessage('Billing cycle must be monthly or annual'),
  body('country')
    .optional()
    .isISO31661Alpha2()
    .withMessage('Country must be a valid ISO 3166-1 alpha-2 code'),
];

// Subscription Validation
export const subscriptionUpgradeValidation: ValidationChain[] = [
  body('plan')
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Valid plan is required'),
];

export const subscriptionCancelValidation: ValidationChain[] = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must be 500 characters or less'),
];

// UUID Validation (for params)
export const uuidValidation: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Valid UUID is required'),
];

// Pagination Validation
export const paginationValidation: ValidationChain[] = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater'),
];

// Search Validation
export const searchValidation: ValidationChain[] = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

// Tenant Management Validation (Super Admin)
export const tenantSuspendValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Valid tenant ID required'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Suspension reason must be between 10 and 500 characters'),
];

export const impersonationValidation: ValidationChain[] = [
  body('userId')
    .isUUID()
    .withMessage('Valid user ID is required'),
];

// Feature Flag Validation
export const featureFlagValidation: ValidationChain[] = [
  param('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Feature flag name must be lowercase alphanumeric with underscores'),
  body('enabled')
    .isBoolean()
    .withMessage('enabled must be a boolean'),
  body('rolloutPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Rollout percentage must be between 0 and 100'),
];

// Financial Entry Validation
export const journalEntryValidation: ValidationChain[] = [
  body('date')
    .isISO8601()
    .withMessage('Valid date is required (ISO 8601 format)'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required (max 500 characters)'),
  body('lines')
    .isArray({ min: 2 })
    .withMessage('At least 2 journal entry lines are required'),
  body('lines.*.accountId')
    .isUUID()
    .withMessage('Valid account ID is required for each line'),
  body('lines.*.debit')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Debit must be a valid decimal number'),
  body('lines.*.credit')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Credit must be a valid decimal number'),
  body('lines.*.description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Line description must be 255 characters or less'),
];

// Customer/Supplier Validation
export const customerValidation: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required (max 255 characters)'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Valid phone number is required'),
  body('taxNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tax number must be 50 characters or less'),
];

// Product Validation
export const productValidation: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name is required (max 255 characters)'),
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU must be uppercase alphanumeric with hyphens'),
  body('unitPrice')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Unit price must be a valid decimal number'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be 100 characters or less'),
];

// Invoice Validation
export const invoiceValidation: ValidationChain[] = [
  body('customerId')
    .isUUID()
    .withMessage('Valid customer ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid invoice date is required'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one invoice item is required'),
  body('items.*.productId')
    .optional()
    .isUUID()
    .withMessage('Valid product ID is required'),
  body('items.*.description')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Item description is required (max 255 characters)'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Unit price must be a valid decimal number'),
];

// Date Range Validation
export const dateRangeValidation: ValidationChain[] = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format'),
];

// File Upload Validation
export const fileUploadValidation: ValidationChain[] = [
  body('module')
    .optional()
    .isIn(['invoice', 'receipt', 'product', 'document'])
    .withMessage('Invalid module type'),
];

// Financial v2 Validation
export const financialCreateJournalEntryValidation: ValidationChain[] = [
  body('posting_date')
    .optional()
    .isISO8601()
    .withMessage('posting_date must be a valid ISO date'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required (max 500 characters)'),
  body('journal_type')
    .optional()
    .isIn(['general', 'sales', 'purchase', 'cash', 'adjustment', 'closing'])
    .withMessage('journal_type must be a valid journal type'),
  body('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'posted'])
    .withMessage('status must be draft, pending_approval, or posted'),
  body('source_type')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('source_type must be 50 characters or less'),
  body('source_id')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('source_id must be 100 characters or less'),
  body('lines')
    .isArray({ min: 1 })
    .withMessage('At least one journal line is required'),
  body('lines').custom((lines) => {
    if (!Array.isArray(lines)) {
      throw new Error('lines must be an array');
    }

    const hasValidAmounts = lines.every((line: any) => {
      const debit = Number(line?.debit_amount) || 0;
      const credit = Number(line?.credit_amount) || 0;
      return debit >= 0 && credit >= 0 && (debit > 0 || credit > 0);
    });

    if (!hasValidAmounts) {
      throw new Error('Each line must have a positive debit_amount or credit_amount');
    }

    return true;
  }),
  body('lines.*.account_id')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('account_id is required for each line'),
  body('lines.*.description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Line description must be 255 characters or less'),
  body('lines.*.cost_center_id')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('cost_center_id must be a string'),
  body('lines.*.project_id')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('project_id must be a string'),
];

export const financialJournalEntryIdValidation: ValidationChain[] = [
  param('id')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid journal entry id is required'),
];

export const financialReverseJournalEntryValidation: ValidationChain[] = [
  ...financialJournalEntryIdValidation,
  body('reversal_date')
    .optional()
    .isISO8601()
    .withMessage('reversal_date must be a valid ISO date'),
];

export const financialListJournalEntriesValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'posted', 'reversed'])
    .withMessage('status must be draft, pending_approval, posted, or reversed'),
  query('from_date')
    .optional()
    .isISO8601()
    .withMessage('from_date must be a valid ISO date'),
  query('to_date')
    .optional()
    .isISO8601()
    .withMessage('to_date must be a valid ISO date'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('page must be between 1 and 500'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('limit must be between 1 and 500'),
];

export const financialLedgerQueryValidation: ValidationChain[] = [
  query('from_date')
    .optional()
    .isISO8601()
    .withMessage('from_date must be a valid ISO date'),
  query('to_date')
    .optional()
    .isISO8601()
    .withMessage('to_date must be a valid ISO date'),
  query('account_code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('account_code must be 1-50 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('limit must be between 1 and 500'),
  query('offset')
    .optional()
    .isInt({ min: 0, max: 5000 })
    .withMessage('offset must be 0 or greater'),
];

export const financialAccountLedgerByAccountCodeValidation: ValidationChain[] = [
  param('accountCode')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('accountCode is required'),
  ...financialLedgerQueryValidation,
];

export const financialAccountLedgerByCodeValidation: ValidationChain[] = [
  param('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('code is required'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO date'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO date'),
];

export const financialCashFlowValidation: ValidationChain[] = [
  query('fromDate')
    .isISO8601()
    .withMessage('fromDate is required and must be an ISO date'),
  query('toDate')
    .isISO8601()
    .withMessage('toDate is required and must be an ISO date'),
];

export const financialApplyTemplateValidation: ValidationChain[] = [
  param('templateId')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('templateId must be alphanumeric with dashes/underscores'),
];

export const financialTaxSettingCreateValidation: ValidationChain[] = [
  body('tax_code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('tax_code is required'),
  body('tax_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('tax_name is required'),
  body('tax_rate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('tax_rate must be between 0 and 100'),
  body('tax_type')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('tax_type is required'),
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be boolean'),
];

export const financialTaxSettingUpdateValidation: ValidationChain[] = [
  param('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Valid tax setting id is required'),
  body('tax_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('tax_rate must be between 0 and 100'),
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be boolean'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean'),
];

export const financialDimensionCreateValidation: ValidationChain[] = [
  body('dimension_code')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('dimension_code is required'),
  body('dimension_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('dimension_name is required'),
  body('dimension_type')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('dimension_type is required'),
  body('parent_dimension_id')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('parent_dimension_id must be a string'),
];

export const financialDimensionUpdateValidation: ValidationChain[] = [
  param('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Valid dimension id is required'),
  body('dimension_code')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('dimension_code must be 30 characters or less'),
  body('dimension_name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('dimension_name must be 100 characters or less'),
  body('dimension_type')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('dimension_type must be 50 characters or less'),
  body('parent_dimension_id')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('parent_dimension_id must be a string'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean'),
];

export const financialFiscalPeriodsValidation: ValidationChain[] = [
  query('year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('year must be a valid 4-digit year'),
];

export const financialTrialBalanceValidation: ValidationChain[] = [
  query('as_of')
    .optional()
    .isISO8601()
    .withMessage('as_of must be a valid ISO date'),
];

export default {
  signupValidation,
  loginValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  paymentSessionValidation,
  subscriptionUpgradeValidation,
  subscriptionCancelValidation,
  uuidValidation,
  paginationValidation,
  searchValidation,
  tenantSuspendValidation,
  impersonationValidation,
  featureFlagValidation,
  journalEntryValidation,
  customerValidation,
  productValidation,
  invoiceValidation,
  dateRangeValidation,
  fileUploadValidation,
  financialCreateJournalEntryValidation,
  financialJournalEntryIdValidation,
  financialReverseJournalEntryValidation,
  financialListJournalEntriesValidation,
  financialLedgerQueryValidation,
  financialAccountLedgerByAccountCodeValidation,
  financialAccountLedgerByCodeValidation,
  financialCashFlowValidation,
  financialApplyTemplateValidation,
  financialTaxSettingCreateValidation,
  financialTaxSettingUpdateValidation,
  financialDimensionCreateValidation,
  financialDimensionUpdateValidation,
  financialFiscalPeriodsValidation,
  financialTrialBalanceValidation,
};
