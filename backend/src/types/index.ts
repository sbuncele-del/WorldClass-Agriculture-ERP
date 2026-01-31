import { Request } from 'express';

// ================================================
// TENANT TYPES
// ================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'deleted';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  trial_ends_at?: Date;
  subscription_starts_at?: Date;
  subscription_ends_at?: Date;
  billing_email?: string;
  billing_cycle: 'monthly' | 'annual';
  billing_day: number;
  next_billing_date?: Date;
  max_users: number;
  max_storage_gb: number;
  features: TenantFeatures;
  settings: TenantSettings;
  company_info: CompanyInfo;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface TenantFeatures {
  ai_automation: boolean;
  multi_currency: boolean;
  advanced_reporting: boolean;
  api_access: boolean;
  custom_branding: boolean;
  // Logistics enterprise extensions (all optional + feature-flagged)
  logistics_atms?: boolean;
  logistics_yard_management?: boolean;
  logistics_dock_scheduling?: boolean;
  logistics_freight_audit?: boolean;
  logistics_carrier_contracts?: boolean;
  logistics_delivery_revenue?: boolean;
  logistics_freight_billing?: boolean;
  logistics_route_profitability?: boolean;
  logistics_carrier_scoring?: boolean;
  logistics_power_bi?: boolean;
  logistics_ai_route_optimization?: boolean;
  logistics_predictive_maintenance?: boolean;
  logistics_iot_ingestion?: boolean;
  logistics_process_genome?: boolean;
  [key: string]: boolean | undefined;
}

export interface TenantSettings {
  currency: string;
  date_format: string;
  timezone: string;
  financial_year_end: string;
}

export interface CompanyInfo {
  registration_number?: string;
  vat_number?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  website?: string;
}

// ================================================
// USER TYPES
// ================================================

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended' | 'invited';
  email_verified: boolean;
  email_verified_at?: Date;
  last_login_at?: Date;
  last_login_ip?: string;
  password_changed_at: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires_at?: Date;
  preferences: UserPreferences;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// ================================================
// REQUEST TYPES (Extended Express Request)
// ================================================

export interface TenantRequest extends Request {
  tenantId?: string;  // Direct tenant ID for backwards compatibility
  userId?: string;    // Direct user ID for backwards compatibility
  tenant?: {
    id: string;
    slug: string;
    name: string;
    status: string;
    subscription_plan: string;
    features: TenantFeatures;
    settings: TenantSettings & { country?: string };
  };
  user?: {
    id: string;
    email: string;
    role: string;
    roles?: string[];  // RBAC roles array
    permissions: string[];
    first_name?: string;
    last_name?: string;
  };
}

// ================================================
// JWT PAYLOAD TYPES
// ================================================

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// ================================================
// AUTHENTICATION TYPES
// ================================================

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string; // Optional for super admin
}

export interface SignupData {
  // Company Info
  companyName: string;
  companySlug?: string;
  industry?: string;
  employeeCount?: string;
  
  // Admin User
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  
  // Subscription
  plan: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  
  // Optional
  referralCode?: string;
  acceptTerms?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: string;
    trialEndsAt?: Date;
    onboarding_data?: Record<string, unknown>;
  };
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

// ================================================
// REFRESH TOKEN TYPES
// ================================================

export interface RefreshToken {
  id: string;
  user_id: string;
  tenant_id: string;
  token: string;
  expires_at: Date;
  device_info: DeviceInfo;
  revoked: boolean;
  revoked_at?: Date;
  created_at: Date;
}

export interface DeviceInfo {
  user_agent?: string;
  ip_address?: string;
  device_type?: string;
}

// ================================================
// AUDIT LOG TYPES
// ================================================

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at: Date;
}

// ================================================
// DEMO TENANT TYPES
// ================================================

export interface DemoTenant {
  id: string;
  tenant_id: string;
  reset_interval_hours: number;
  last_reset_at: Date;
  next_reset_at?: Date;
  auto_reset_enabled: boolean;
  is_public: boolean;
  access_code?: string;
  max_concurrent_users: number;
  demo_type: 'full' | 'limited' | 'guided';
  sample_data_size: 'small' | 'medium' | 'large';
  created_at: Date;
  updated_at: Date;
}

// ================================================
// SUBSCRIPTION TYPES
// ================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'starter' | 'professional' | 'enterprise';
  priceMonthly: number;
  priceAnnual: number;
  maxUsers: number;
  maxStorageGb: number;
  features: string[];
  description: string;
}

export interface Subscription {
  tenant_id: string;
  plan: SubscriptionPlan;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  cancelled_at?: Date;
}

// ================================================
// ERROR TYPES
// ================================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}
