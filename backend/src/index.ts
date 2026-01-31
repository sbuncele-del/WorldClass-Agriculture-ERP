// MUST load dotenv FIRST before any other imports that use environment variables
import dotenv from 'dotenv';
import path from 'path';
// Use explicit path to ensure .env is found regardless of cwd
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express, { Application } from 'express';
import http from 'http';
import { randomUUID } from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { validateEnv } from './config/env.validation';
import authRoutes from './auth/auth.routes';
import onboardingRoutes from './routes/onboarding.routes';
import emailPreferencesRoutes from './routes/email-preferences.routes';
import emailQueueRoutes from './routes/email-queue.routes';
import tenantSettingsRoutes from './routes/tenant-settings.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import subscriptionRoutes from './routes/subscription.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import purchaseRoutes from './routes/purchase.routes';
import financialRoutes from './routes/financial.routes';
import dimensionsRoutes from './routes/dimensions.routes';
import periodRoutes from './routes/period.routes';
import dashboardRoutes from './routes/dashboard.routes';
import approvalRoutes from './routes/approval.routes';
import hrRoutes from './routes/hr.routes';
import manufacturingRoutes from './modules/manufacturing/routes/manufacturing.routes';
import warehouseRoutes from './routes/warehouse.routes';
import sarsSentinelRoutes from './routes/sars-sentinel.routes';
import cashManagementRoutes from './routes/cash-management.routes';
import financialReportsRoutes from './routes/financial-reports.routes';
import recurringEntriesRoutes from './routes/recurring-entries.routes';
import importEntriesRoutes from './routes/import-entries.routes';
import glExplorerRoutes from './routes/gl-explorer.routes';
import auditTrailRoutes from './routes/audit-trail.routes';
import taxSettingsRoutes from './routes/tax-settings.routes';
import financialForecastingRoutes from './routes/financial-forecasting.routes';
import customReportsRoutes from './routes/custom-reports.routes';
import practiceRoutes from './routes/practice.routes';
import assetsRoutes from './routes/assets.routes';
// import demoResetRoutes from './routes/demo-reset.routes'; // DISABLED - causes Bull/Redis initialization
import superAdminRoutes from './routes/super-admin.routes';
import adminRoutes from './routes/admin.routes';
import complianceRoutes from './routes/compliance.routes';
import auditReadyRoutes from './routes/audit-ready.routes';

// V2 Routes - Tenant-Hardened Controllers (multi-tenant secure)
import v2Routes from './routes/v2.routes';
import reportsRoutes from './routes/reports.routes';
import treasuryRoutes from './routes/treasury.routes';
import aiAssistantRoutes from './routes/ai-assistant.routes';
import agentRoutes from './routes/agent.routes';
import multiEntityRoutes from './routes/multi-entity.routes';
import healthcareRoutes from './routes/healthcare.routes';
import superadminRoutes from './routes/superadmin.routes';
import modulesRoutes from './routes/modules.routes';
import messagesRoutes from './routes/messages.routes';
import deliveryRoutes from './routes/delivery.routes';
import meetingsRoutes from './routes/meetings.routes';
import DemoResetService from './services/demo-reset.service';
import { initializeLogisticsGateway } from './websocket/logistics.gateway';
import { securityHeaders, securityLogger } from './middleware/security';
import { apiLimiter, authLimiter, adminLimiter, webhookLimiter, demoLimiter } from './middleware/rateLimiter';
import logisticsRoutes from './modules/logistics/logistics.routes';
import { authenticateToken } from './middleware/auth';
import { auditMiddleware } from './middleware/audit.middleware';
import { tenantMiddleware } from './middleware/tenant';
import auditLogRoutes from './routes/audit-log.routes';
import { healthCheck as dbHealthCheck } from './config/database';
import { redisHealthCheck } from './services/redis.service';
import { createCacheMiddleware } from './middleware/cache.middleware';
// import gpsRoutes from './modules/logistics/gps.routes'; // May have issues
import chartOfAccountsRoutes from './modules/chart-of-accounts/routes';
import financialReportsRoutes2 from './modules/financial-reports/routes';
import salesInvoiceRoutes from './modules/sales/routes';
import purchaseInvoiceRoutes from './modules/purchases/routes';
import assetManagementRoutes from './modules/assets/routes';

// NEW API ROUTES - December 2025
import projectsRoutes from './routes/projects.routes';
import proposalsRoutes from './routes/proposals.routes';
import communicationsRoutes from './routes/communications.routes';
import calendarRoutes from './routes/calendar.routes';
import miningRoutes from './routes/mining.routes';
import agricultureRoutes from './routes/agriculture.routes';
import constructionRoutes from './routes/construction.routes';
import propertyRoutes from './routes/property.routes';

// Validate environment variables
validateEnv();

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration() as any,  // Type assertion for Sentry version mismatch
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// DEBUG: Log database connection info
console.log('=== ENVIRONMENT DEBUG ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('========================');

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const httpServer = http.createServer(app);

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WorldClass ERP - Logistics API',
      version: '1.0.0',
      description: 'Logistics module endpoints for WorldClass ERP'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`
      }
    ]
  },
  apis: ['src/modules/logistics/**/*.ts', 'dist/modules/logistics/**/*.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Trust proxy - required for rate limiting behind nginx
app.set('trust proxy', 1);

// Attach a request ID for traceability across logs and responses
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Middleware
// Helmet disabled - CSP was blocking frontend API requests
// Security headers are handled by securityHeaders middleware instead
// app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration for Codespaces and local development
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all GitHub Codespaces URLs
    if (origin.includes('.app.github.dev')) return callback(null, true);
    
    // Allow localhost for local development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    
    callback(null, true); // Allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('dev'));

// Security middleware
app.use(securityHeaders);
app.use(securityLogger);

// IMPORTANT: Stripe webhooks need raw body for signature verification
// Must come BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Standard JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/health/db', async (_req, res) => {
  try {
    const healthy = await dbHealthCheck();
    if (healthy) {
      return res.status(200).json({ status: 'OK', message: 'Database reachable' });
    }
    return res.status(503).json({ status: 'UNAVAILABLE', message: 'Database unreachable' });
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(503).json({ status: 'UNAVAILABLE', message: 'Database health check failed', error: (error as Error).message });
  }
});

app.get('/health/redis', async (_req, res) => {
  try {
    const { status, latencyMs } = await redisHealthCheck();
    const code = status === 'up' ? 200 : 503;
    return res.status(code).json({ status: status.toUpperCase(), latencyMs });
  } catch (error) {
    console.error('Redis health check failed:', error);
    return res.status(503).json({ status: 'UNAVAILABLE', message: 'Redis health check failed', error: (error as Error).message });
  }
});

// Migration endpoint - no auth required, protected by secret header
app.post('/api/migrate/:module', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== 'worldclass-migrate-2026') {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  const { module } = req.params;
  try {
    let result;
    const pool = (await import('./config/database')).default;
    const fs = await import('fs');
    const path = await import('path');
    
    switch (module) {
      case 'financial':
        // Create financial/accounting tables from SQL migration
        const finSqlPath = path.join('/app', 'database', 'migrations', '011_financial_accounting_module.sql');
        const finSql = fs.readFileSync(finSqlPath, 'utf8');
        await pool.query(finSql);
        result = 'Financial Accounting tables created successfully';
        break;
      
      case 'financial-core':
        // Create just the essential GL tables (chart_of_accounts, journal_entries, journal_entry_lines)
        await pool.query(`
          -- Chart of Accounts
          CREATE TABLE IF NOT EXISTS chart_of_accounts (
            account_id SERIAL PRIMARY KEY,
            tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
            code VARCHAR(50) NOT NULL,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            parent_code VARCHAR(50),
            account_level INTEGER NOT NULL DEFAULT 1,
            is_header BOOLEAN DEFAULT false,
            account_type VARCHAR(50) NOT NULL,
            account_subtype VARCHAR(50),
            category VARCHAR(100),
            normal_balance VARCHAR(10) NOT NULL DEFAULT 'DEBIT',
            is_control_account BOOLEAN DEFAULT false,
            allows_manual_entries BOOLEAN DEFAULT true,
            current_balance DECIMAL(15,2) DEFAULT 0,
            ytd_debit DECIMAL(15,2) DEFAULT 0,
            ytd_credit DECIMAL(15,2) DEFAULT 0,
            currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
            is_active BOOLEAN DEFAULT true,
            is_system_account BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0,
            created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by UUID,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uk_coa_code UNIQUE (code)
          );
          CREATE INDEX IF NOT EXISTS idx_coa_tenant ON chart_of_accounts(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_coa_code ON chart_of_accounts(code);
          CREATE INDEX IF NOT EXISTS idx_coa_type ON chart_of_accounts(account_type);
          
          -- Journal Entries Header
          CREATE TABLE IF NOT EXISTS journal_entries (
            journal_entry_id SERIAL PRIMARY KEY,
            tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
            journal_number VARCHAR(50) NOT NULL,
            journal_date DATE NOT NULL,
            posting_date DATE,
            source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
            source_document_type VARCHAR(50),
            source_document_id INTEGER,
            description TEXT NOT NULL,
            reference VARCHAR(200),
            total_debit DECIMAL(15,2) NOT NULL,
            total_credit DECIMAL(15,2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
            status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
            posted_by UUID,
            posted_at TIMESTAMP,
            is_reversal BOOLEAN DEFAULT false,
            created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_by UUID,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uk_je_number UNIQUE (journal_number)
          );
          CREATE INDEX IF NOT EXISTS idx_je_tenant ON journal_entries(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_je_number ON journal_entries(journal_number);
          CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(journal_date DESC);
          CREATE INDEX IF NOT EXISTS idx_je_status ON journal_entries(status);
          
          -- Journal Entry Lines
          CREATE TABLE IF NOT EXISTS journal_entry_lines (
            line_id SERIAL PRIMARY KEY,
            journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
            line_number INTEGER NOT NULL DEFAULT 1,
            account_code VARCHAR(50) NOT NULL,
            debit_amount DECIMAL(15,2) DEFAULT 0,
            credit_amount DECIMAL(15,2) DEFAULT 0,
            currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
            description TEXT,
            is_reconciled BOOLEAN DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_jel_entry ON journal_entry_lines(journal_entry_id);
          CREATE INDEX IF NOT EXISTS idx_jel_account ON journal_entry_lines(account_code);
        `);
        result = 'Financial Core tables (chart_of_accounts, journal_entries, journal_entry_lines) created successfully';
        break;
        
      case 'cash-management':
        // Use the SQL migration file which has the correct table names
        // In Docker: /app/database/migrations/...
        const sqlPath = path.join('/app', 'database', 'migrations', '010_cash_management_module.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        result = 'Cash Management tables created successfully from SQL migration';
        break;
      case 'cash-views':
        // Create comprehensive compatibility views for services
        // First drop existing objects
        const drops = [
          'DROP VIEW IF EXISTS bank_accounts CASCADE',
          'DROP VIEW IF EXISTS bank_statements CASCADE', 
          'DROP VIEW IF EXISTS bank_statement_lines CASCADE',
          'DROP VIEW IF EXISTS bank_reconciliation_rules CASCADE',
          'DROP TABLE IF EXISTS bank_accounts CASCADE',
          'DROP TABLE IF EXISTS bank_statements CASCADE',
          'DROP TABLE IF EXISTS bank_statement_lines CASCADE',
          'DROP TABLE IF EXISTS bank_reconciliation_rules CASCADE',
          'DROP TABLE IF EXISTS bank_reconciliation_matches CASCADE'
        ];
        for (const sql of drops) {
          try { await pool.query(sql); } catch (e) { /* ignore */ }
        }
        
        // Create bank_reconciliation_matches table (doesn't exist in SQL migration)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS bank_reconciliation_matches (
            id SERIAL PRIMARY KEY,
            tenant_id UUID NOT NULL,
            bank_statement_line_id INTEGER REFERENCES cash_bank_statement_lines(line_id),
            transaction_id INTEGER REFERENCES cash_transactions(transaction_id),
            match_type VARCHAR(50) DEFAULT 'MANUAL',
            matched_by UUID,
            statement_amount DECIMAL(15,2),
            transaction_amount DECIMAL(15,2),
            status VARCHAR(20) DEFAULT 'ACTIVE',
            notes TEXT,
            match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            unmatched_at TIMESTAMP,
            unmatched_by UUID,
            unmatch_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_tenant ON bank_reconciliation_matches(tenant_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_line ON bank_reconciliation_matches(bank_statement_line_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_matches_txn ON bank_reconciliation_matches(transaction_id)');
        
        // Create views with proper column mappings
        await pool.query(`
          CREATE VIEW bank_accounts AS 
          SELECT 
            ba.account_id as id,
            ba.tenant_id,
            ba.bank_id,
            ba.bank_code,
            ba.account_name,
            ba.account_number,
            ba.account_type,
            ba.branch_code,
            ba.swift_code,
            ba.iban,
            ba.currency,
            ba.opening_balance,
            ba.current_balance,
            ba.available_balance,
            ba.overdraft_limit,
            ba.last_reconciled_date,
            ba.last_reconciled_balance,
            ba.unreconciled_count,
            ba.gl_account_code,
            ba.is_primary,
            ba.is_active,
            ba.requires_approval,
            ba.created_by,
            ba.created_at,
            ba.updated_by,
            ba.updated_at,
            COALESCE(cb.bank_name, 'Unknown Bank') as bank_name
          FROM cash_bank_accounts ba
          LEFT JOIN cash_banks cb ON ba.bank_id = cb.bank_id
        `);
        
        await pool.query(`
          CREATE VIEW bank_statements AS
          SELECT 
            statement_id as id,
            tenant_id,
            account_id as bank_account_id,
            statement_date,
            statement_number,
            period_from,
            period_to,
            opening_balance,
            closing_balance,
            total_debits,
            total_credits,
            status,
            reconciliation_date,
            reconciled_by,
            imported_date,
            imported_by,
            import_source,
            total_lines,
            matched_lines,
            unmatched_lines,
            created_by,
            created_at,
            updated_by,
            updated_at
          FROM cash_bank_statements
        `);
        
        await pool.query(`
          CREATE VIEW bank_statement_lines AS
          SELECT 
            bsl.line_id as id,
            bs.tenant_id,
            bsl.statement_id,
            bsl.line_number,
            bsl.transaction_date,
            bsl.value_date,
            bsl.description,
            bsl.reference,
            bsl.cheque_number,
            bsl.debit_amount,
            bsl.credit_amount,
            COALESCE(bsl.credit_amount, 0) - COALESCE(bsl.debit_amount, 0) as amount,
            bsl.balance,
            bsl.is_matched,
            bsl.is_matched as reconciled,
            CASE WHEN bsl.is_matched THEN 'MATCHED' ELSE 'UNMATCHED' END as status,
            bsl.matched_transaction_id,
            bsl.match_confidence,
            bsl.match_date,
            bsl.matched_by,
            bsl.suggested_matches,
            bsl.auto_category,
            bsl.confirmed_category,
            bsl.raw_data,
            bsl.parsing_errors,
            bsl.created_at
          FROM cash_bank_statement_lines bsl
          JOIN cash_bank_statements bs ON bsl.statement_id = bs.statement_id
        `);
        
        await pool.query(`
          CREATE VIEW bank_reconciliation_rules AS
          SELECT 
            rule_id as id,
            tenant_id,
            rule_name,
            rule_description as description,
            is_active,
            priority,
            auto_gl_account as target_gl_account,
            auto_category as target_category,
            auto_approve,
            conditions,
            matches_count as match_count,
            last_matched as last_match_date,
            created_by,
            created_at,
            updated_by,
            updated_at
          FROM cash_reconciliation_rules
        `);
        
        result = 'Comprehensive compatibility views and tables created successfully';
        break;
      
      case 'unlock-admin':
        // Reset login attempts for admin user
        await pool.query(`
          UPDATE users SET 
            login_attempts = 0, 
            locked_until = NULL,
            is_locked = false
          WHERE email = 'admin@siyabusaerp.co.za'
        `);
        result = 'Admin account unlocked successfully';
        break;
      
      case 'gl-integration':
        // Setup GL integration for Cash Management
        // 1. Add missing columns to cash_transactions
        await pool.query(`
          ALTER TABLE cash_transactions 
          ADD COLUMN IF NOT EXISTS posted_to_gl BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS journal_entry_id UUID,
          ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP,
          ADD COLUMN IF NOT EXISTS posted_by UUID,
          ADD COLUMN IF NOT EXISTS gl_posting_error TEXT
        `);
        
        // 2. Ensure journal_entries table has needed columns
        await pool.query(`
          ALTER TABLE journal_entries 
          ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
          ADD COLUMN IF NOT EXISTS source_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS fiscal_year INTEGER,
          ADD COLUMN IF NOT EXISTS fiscal_period INTEGER
        `);
        
        // 3. Ensure journal_entry_lines table has needed columns
        await pool.query(`
          ALTER TABLE journal_entry_lines 
          ADD COLUMN IF NOT EXISTS line_number INTEGER DEFAULT 1
        `);
        
        // 4. Ensure chart_of_accounts has needed columns
        await pool.query(`
          ALTER TABLE chart_of_accounts 
          ADD COLUMN IF NOT EXISTS normal_balance VARCHAR(10) DEFAULT 'DEBIT',
          ADD COLUMN IF NOT EXISTS is_header BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS allow_manual_entry BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS is_system_account BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ZAR',
          ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS current_balance DECIMAL(15,2) DEFAULT 0
        `);
        
        result = 'GL Integration columns added successfully';
        break;
        
      case 'seed-chart-of-accounts':
        // Seed South African standard Chart of Accounts for all tenants
        const tenantIdParam = req.body?.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c';
        
        // South African Standard Chart of Accounts
        const accounts = [
          // ASSETS (1xxx)
          { code: '1000', name: 'Current Assets', type: 'ASSET', balance: 'DEBIT', header: true },
          { code: '1100', name: 'Bank Accounts', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1110', name: 'FNB Current Account', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1120', name: 'FNB Savings Account', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1130', name: 'ABSA Current Account', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1140', name: 'Standard Bank Account', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1150', name: 'Nedbank Account', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1160', name: 'Capitec Account', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1200', name: 'Accounts Receivable (Debtors)', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1300', name: 'Inventory', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1400', name: 'Prepaid Expenses', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1500', name: 'Fixed Assets', type: 'ASSET', balance: 'DEBIT', header: true },
          { code: '1510', name: 'Property, Plant & Equipment', type: 'ASSET', balance: 'DEBIT', header: false },
          { code: '1520', name: 'Accumulated Depreciation', type: 'ASSET', balance: 'CREDIT', header: false },
          { code: '1600', name: 'Intangible Assets', type: 'ASSET', balance: 'DEBIT', header: false },
          
          // LIABILITIES (2xxx)
          { code: '2000', name: 'Current Liabilities', type: 'LIABILITY', balance: 'CREDIT', header: true },
          { code: '2100', name: 'Accounts Payable (Creditors)', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2200', name: 'PAYE Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2210', name: 'UIF Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2220', name: 'SDL Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2230', name: 'VAT Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2240', name: 'Provisional Tax Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2250', name: 'Salaries Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2300', name: 'Accrued Expenses', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2400', name: 'Unearned Revenue', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2500', name: 'Long-term Liabilities', type: 'LIABILITY', balance: 'CREDIT', header: true },
          { code: '2510', name: 'Bank Loans', type: 'LIABILITY', balance: 'CREDIT', header: false },
          { code: '2520', name: 'Mortgage Payable', type: 'LIABILITY', balance: 'CREDIT', header: false },
          
          // EQUITY (3xxx)
          { code: '3000', name: 'Equity', type: 'EQUITY', balance: 'CREDIT', header: true },
          { code: '3100', name: 'Share Capital', type: 'EQUITY', balance: 'CREDIT', header: false },
          { code: '3200', name: 'Retained Earnings', type: 'EQUITY', balance: 'CREDIT', header: false },
          { code: '3300', name: 'Current Year Profit/Loss', type: 'EQUITY', balance: 'CREDIT', header: false },
          { code: '3400', name: 'Drawings', type: 'EQUITY', balance: 'DEBIT', header: false },
          
          // REVENUE (4xxx)
          { code: '4000', name: 'Revenue', type: 'REVENUE', balance: 'CREDIT', header: true },
          { code: '4100', name: 'Sales Revenue', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4110', name: 'Service Revenue', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4120', name: 'Product Sales', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4200', name: 'Interest Income', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4300', name: 'Other Income', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4400', name: 'Salary/Wages Received', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4500', name: 'Commission Income', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4600', name: 'Rental Income', type: 'REVENUE', balance: 'CREDIT', header: false },
          { code: '4900', name: 'Discounts Received', type: 'REVENUE', balance: 'CREDIT', header: false },
          
          // COST OF SALES (5xxx)
          { code: '5000', name: 'Cost of Sales', type: 'EXPENSE', balance: 'DEBIT', header: true },
          { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '5200', name: 'Purchases', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '5300', name: 'Freight & Delivery', type: 'EXPENSE', balance: 'DEBIT', header: false },
          
          // OPERATING EXPENSES (6xxx)
          { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', balance: 'DEBIT', header: true },
          { code: '6100', name: 'Salaries & Wages Expense', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6110', name: 'Employee Benefits', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6120', name: 'Employer UIF Contributions', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6130', name: 'Employer SDL Contributions', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6200', name: 'Rent Expense', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6210', name: 'Utilities - Electricity', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6220', name: 'Utilities - Water', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6230', name: 'Utilities - Gas', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6300', name: 'Telephone & Internet', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6400', name: 'Insurance', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6500', name: 'Bank Charges', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6600', name: 'Professional Fees', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6610', name: 'Accounting Fees', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6620', name: 'Legal Fees', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6630', name: 'Consulting Fees', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6700', name: 'Office Expenses', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6710', name: 'Office Supplies', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6720', name: 'Printing & Stationery', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6800', name: 'Travel & Entertainment', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6810', name: 'Motor Vehicle Expenses', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6820', name: 'Meals & Entertainment', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '6900', name: 'Advertising & Marketing', type: 'EXPENSE', balance: 'DEBIT', header: false },
          
          // OTHER EXPENSES (7xxx)
          { code: '7000', name: 'Other Expenses', type: 'EXPENSE', balance: 'DEBIT', header: true },
          { code: '7100', name: 'General Expenses', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7200', name: 'Repairs & Maintenance', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7300', name: 'Depreciation Expense', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7400', name: 'Amortization Expense', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7500', name: 'Bad Debts', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7600', name: 'Interest Expense', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7700', name: 'Foreign Exchange Loss', type: 'EXPENSE', balance: 'DEBIT', header: false },
          { code: '7800', name: 'Tax Expense', type: 'EXPENSE', balance: 'DEBIT', header: false },
          
          // SUSPENSE (9xxx)
          { code: '9000', name: 'Suspense Accounts', type: 'EXPENSE', balance: 'DEBIT', header: true },
          { code: '9999', name: 'Uncategorized - Review Required', type: 'EXPENSE', balance: 'DEBIT', header: false },
        ];
        
        for (const acc of accounts) {
          await pool.query(`
            INSERT INTO chart_of_accounts (
              tenant_id, code, name, account_type, 
              normal_balance, is_header, account_level, is_active,
              allows_manual_entries, is_system_account, currency,
              current_balance
            ) VALUES ($1, $2, $3, $4, $5, $6, 1, true, true, false, 'ZAR', 0)
            ON CONFLICT (code) DO NOTHING
          `, [tenantIdParam, acc.code, acc.name, acc.type, acc.balance, acc.header]);
        }
        
        const countResult = await pool.query(
          'SELECT COUNT(*) FROM chart_of_accounts WHERE tenant_id = $1',
          [tenantIdParam]
        );
        
        result = `Chart of Accounts seeded successfully. Total accounts: ${countResult.rows[0].count}`;
        break;
        
      case 'logistics':
        // Create logistics schema and all tables
        await pool.query(`
          -- Create logistics schema
          CREATE SCHEMA IF NOT EXISTS logistics;

          -- Vehicles table
          CREATE TABLE IF NOT EXISTS logistics.vehicles (
              vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              vehicle_registration VARCHAR(20) NOT NULL,
              make VARCHAR(100),
              model VARCHAR(100),
              vehicle_type VARCHAR(50),
              year INTEGER,
              vin VARCHAR(50),
              color VARCHAR(50),
              fuel_type VARCHAR(20) DEFAULT 'DIESEL',
              fuel_capacity DECIMAL(10,2),
              payload_capacity_kg DECIMAL(10,2),
              volume_capacity_m3 DECIMAL(10,2),
              status VARCHAR(20) DEFAULT 'ACTIVE',
              current_odometer INTEGER,
              current_driver_id UUID,
              current_location VARCHAR(255),
              last_service_date DATE,
              next_service_date DATE,
              license_expiry DATE,
              insurance_expiry DATE,
              gps_device_id VARCHAR(100),
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              is_active BOOLEAN DEFAULT true
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_tenant ON logistics.vehicles(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_status ON logistics.vehicles(tenant_id, status);
          CREATE INDEX IF NOT EXISTS idx_logistics_vehicles_reg ON logistics.vehicles(vehicle_registration);

          -- Drivers table
          CREATE TABLE IF NOT EXISTS logistics.drivers (
              driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              user_id UUID,
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              id_number VARCHAR(20),
              phone VARCHAR(20),
              email VARCHAR(255),
              license_number VARCHAR(50),
              license_type VARCHAR(20),
              license_expiry DATE,
              pdp_expiry DATE,
              status VARCHAR(20) DEFAULT 'AVAILABLE',
              rating DECIMAL(3,2) DEFAULT 5.00,
              total_trips INTEGER DEFAULT 0,
              total_km DECIMAL(12,2) DEFAULT 0,
              hire_date DATE,
              emergency_contact VARCHAR(100),
              emergency_phone VARCHAR(20),
              notes TEXT,
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              is_active BOOLEAN DEFAULT true,
              -- Driver App Authentication columns
              access_code VARCHAR(8),
              access_code_generated_at TIMESTAMP,
              access_code_used_at TIMESTAMP,
              app_approved BOOLEAN DEFAULT false,
              app_first_login_at TIMESTAMP,
              app_last_login_at TIMESTAMP,
              push_notification_token TEXT
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_drivers_tenant ON logistics.drivers(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_drivers_status ON logistics.drivers(tenant_id, status);
          CREATE INDEX IF NOT EXISTS idx_logistics_drivers_user ON logistics.drivers(user_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_drivers_access_code ON logistics.drivers(access_code) WHERE access_code IS NOT NULL;
          CREATE INDEX IF NOT EXISTS idx_logistics_drivers_phone ON logistics.drivers(phone, tenant_id);

          -- Driver Sessions table for persistent mobile app login
          CREATE TABLE IF NOT EXISTS logistics.driver_sessions (
              session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              driver_id UUID NOT NULL REFERENCES logistics.drivers(driver_id) ON DELETE CASCADE,
              token VARCHAR(255) NOT NULL UNIQUE,
              device_info JSONB,
              ip_address VARCHAR(45),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              expires_at TIMESTAMP NOT NULL,
              is_active BOOLEAN DEFAULT true
          );

          CREATE INDEX IF NOT EXISTS idx_driver_sessions_token ON logistics.driver_sessions(token) WHERE is_active = true;
          CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver ON logistics.driver_sessions(driver_id, is_active);

          -- Routes table
          CREATE TABLE IF NOT EXISTS logistics.routes (
              route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              route_name VARCHAR(255) NOT NULL,
              origin VARCHAR(255) NOT NULL,
              destination VARCHAR(255) NOT NULL,
              distance_km DECIMAL(10,2),
              estimated_duration_hours DECIMAL(5,2),
              route_type VARCHAR(50),
              waypoints JSONB DEFAULT '[]',
              status VARCHAR(20) DEFAULT 'ACTIVE',
              toll_costs DECIMAL(10,2) DEFAULT 0,
              fuel_estimate DECIMAL(10,2),
              notes TEXT,
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_routes_tenant ON logistics.routes(tenant_id);

          -- Trips table
          CREATE TABLE IF NOT EXISTS logistics.trips (
              trip_id VARCHAR(50) PRIMARY KEY,
              tenant_id UUID NOT NULL,
              route_id UUID REFERENCES logistics.routes(route_id),
              vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
              driver_id UUID REFERENCES logistics.drivers(driver_id),
              customer VARCHAR(255),
              customer_id UUID,
              origin VARCHAR(255) NOT NULL,
              destination VARCHAR(255) NOT NULL,
              driver VARCHAR(255),
              vehicle_reg VARCHAR(20),
              cargo_description TEXT,
              weight_kg DECIMAL(10,2),
              status VARCHAR(30) DEFAULT 'Planned',
              pod_status VARCHAR(30) DEFAULT 'Pending',
              scheduled_start TIMESTAMPTZ,
              scheduled_end TIMESTAMPTZ,
              actual_start TIMESTAMPTZ,
              actual_end TIMESTAMPTZ,
              eta TIMESTAMPTZ,
              distance_km DECIMAL(10,2),
              fuel_used DECIMAL(10,2),
              revenue DECIMAL(15,2),
              cost DECIMAL(15,2),
              notes TEXT,
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_trips_tenant ON logistics.trips(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_trips_status ON logistics.trips(tenant_id, status);
          CREATE INDEX IF NOT EXISTS idx_logistics_trips_driver ON logistics.trips(tenant_id, driver_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_trips_vehicle ON logistics.trips(tenant_id, vehicle_id);

          -- Shipments table
          CREATE TABLE IF NOT EXISTS logistics.shipments (
              shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              shipment_number VARCHAR(50) UNIQUE,
              trip_id VARCHAR(50) REFERENCES logistics.trips(trip_id),
              customer_id UUID,
              origin_address TEXT,
              destination_address TEXT,
              scheduled_pickup_date DATE,
              scheduled_delivery_date DATE,
              actual_pickup_date DATE,
              actual_delivery_date DATE,
              weight DECIMAL(10,2),
              volume DECIMAL(10,2),
              package_count INTEGER DEFAULT 1,
              status VARCHAR(30) DEFAULT 'PENDING',
              priority VARCHAR(20) DEFAULT 'NORMAL',
              special_instructions TEXT,
              notes TEXT,
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_shipments_tenant ON logistics.shipments(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_shipments_status ON logistics.shipments(tenant_id, status);

          -- Fuel transactions table
          CREATE TABLE IF NOT EXISTS logistics.fuel_transactions (
              transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
              driver_id UUID REFERENCES logistics.drivers(driver_id),
              trip_id VARCHAR(50) REFERENCES logistics.trips(trip_id),
              transaction_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              fuel_type VARCHAR(20) DEFAULT 'DIESEL',
              quantity_liters DECIMAL(10,2) NOT NULL,
              price_per_liter DECIMAL(10,2) NOT NULL,
              total_amount DECIMAL(12,2) NOT NULL,
              odometer_reading INTEGER,
              station_name VARCHAR(255),
              station_location VARCHAR(255),
              receipt_number VARCHAR(100),
              payment_method VARCHAR(50),
              card_number VARCHAR(50),
              notes TEXT,
              reconciled BOOLEAN DEFAULT false,
              reconciled_at TIMESTAMPTZ,
              reconciled_by UUID,
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_fuel_tenant ON logistics.fuel_transactions(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_fuel_vehicle ON logistics.fuel_transactions(vehicle_id);

          -- Geofences table
          CREATE TABLE IF NOT EXISTS logistics.geofences (
              geofence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              name VARCHAR(255) NOT NULL,
              geofence_type VARCHAR(50) DEFAULT 'ZONE',
              geometry JSONB NOT NULL,
              center_lat DECIMAL(10,8),
              center_lng DECIMAL(11,8),
              radius_meters INTEGER,
              address TEXT,
              is_active BOOLEAN DEFAULT true,
              alert_on_entry BOOLEAN DEFAULT true,
              alert_on_exit BOOLEAN DEFAULT true,
              speed_limit INTEGER,
              dwell_time_alert_minutes INTEGER,
              created_by UUID,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_geofences_tenant ON logistics.geofences(tenant_id);

          -- Incidents table
          CREATE TABLE IF NOT EXISTS logistics.incidents (
              incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              tenant_id UUID NOT NULL,
              trip_id VARCHAR(50) REFERENCES logistics.trips(trip_id),
              vehicle_id UUID REFERENCES logistics.vehicles(vehicle_id),
              driver_id UUID REFERENCES logistics.drivers(driver_id),
              incident_type VARCHAR(50) NOT NULL,
              severity VARCHAR(20) DEFAULT 'MEDIUM',
              description TEXT NOT NULL,
              location VARCHAR(255),
              latitude DECIMAL(10,8),
              longitude DECIMAL(11,8),
              incident_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              status VARCHAR(30) DEFAULT 'REPORTED',
              resolution TEXT,
              police_case_number VARCHAR(100),
              insurance_claim_number VARCHAR(100),
              estimated_cost DECIMAL(12,2),
              actual_cost DECIMAL(12,2),
              reported_by UUID,
              assigned_to UUID,
              resolved_at TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_logistics_incidents_tenant ON logistics.incidents(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_logistics_incidents_status ON logistics.incidents(tenant_id, status);
        `);
        result = 'Logistics schema and all tables created successfully';
        break;

      case 'logistics-seed':
        // Seed logistics sample data
        const seedTenantId = req.body?.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c';
        
        // Insert sample vehicles
        await pool.query(`
          INSERT INTO logistics.vehicles (tenant_id, vehicle_registration, make, model, vehicle_type, year, fuel_type, status, current_odometer) VALUES
          ($1, 'ABC123GP', 'Isuzu', 'NPR 400', 'TRUCK', 2020, 'DIESEL', 'ACTIVE', 85000),
          ($1, 'DEF456GP', 'Hino', '300 Series', 'TRUCK', 2021, 'DIESEL', 'ACTIVE', 45000),
          ($1, 'GHI789GP', 'Toyota', 'Hilux 2.8 GD-6', 'BAKKIE', 2022, 'DIESEL', 'ACTIVE', 32000),
          ($1, 'JKL012GP', 'UD', 'Quon', 'TRUCK', 2019, 'DIESEL', 'MAINTENANCE', 125000),
          ($1, 'MNO345GP', 'Mercedes-Benz', 'Sprinter', 'VAN', 2023, 'DIESEL', 'ACTIVE', 15000)
          ON CONFLICT DO NOTHING
        `, [seedTenantId]);

        // Insert sample drivers
        await pool.query(`
          INSERT INTO logistics.drivers (tenant_id, first_name, last_name, phone, license_number, status) VALUES
          ($1, 'Thabo', 'Molefe', '0821234567', 'L1234567', 'AVAILABLE'),
          ($1, 'Sipho', 'Dlamini', '0832345678', 'L2345678', 'ON_TRIP'),
          ($1, 'John', 'van der Merwe', '0843456789', 'L3456789', 'AVAILABLE'),
          ($1, 'Patrick', 'Nkosi', '0854567890', 'L4567890', 'OFF_DUTY'),
          ($1, 'Michael', 'Smith', '0865678901', 'L5678901', 'AVAILABLE')
          ON CONFLICT DO NOTHING
        `, [seedTenantId]);

        // Insert sample routes
        await pool.query(`
          INSERT INTO logistics.routes (tenant_id, route_name, origin, destination, distance_km, estimated_duration_hours) VALUES
          ($1, 'JHB-DBN', 'Johannesburg', 'Durban', 575, 6.5),
          ($1, 'JHB-CPT', 'Johannesburg', 'Cape Town', 1400, 14),
          ($1, 'JHB-PTA', 'Johannesburg', 'Pretoria', 60, 1),
          ($1, 'DBN-PE', 'Durban', 'Port Elizabeth', 720, 8),
          ($1, 'JHB-BFN', 'Johannesburg', 'Bloemfontein', 400, 4.5)
          ON CONFLICT DO NOTHING
        `, [seedTenantId]);

        result = 'Logistics sample data seeded successfully';
        break;

      case 'recalculate-gl-balances':
        // Reset and recalculate account balances from journal entries
        // Step 1: Reset all balances to zero
        await pool.query(`
          UPDATE chart_of_accounts 
          SET current_balance = 0, ytd_debit = 0, ytd_credit = 0
          WHERE tenant_id = $1
        `, [req.body?.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c']);
        
        // Step 2: Recalculate from journal entry lines
        await pool.query(`
          WITH account_totals AS (
            SELECT 
              jel.account_code,
              SUM(jel.debit_amount) as total_debits,
              SUM(jel.credit_amount) as total_credits
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.journal_entry_id
            WHERE je.status = 'POSTED' 
              AND je.tenant_id = $1
            GROUP BY jel.account_code
          )
          UPDATE chart_of_accounts coa
          SET 
            ytd_debit = COALESCE(at.total_debits, 0),
            ytd_credit = COALESCE(at.total_credits, 0),
            current_balance = CASE 
              WHEN coa.normal_balance = 'DEBIT' 
                THEN COALESCE(at.total_debits, 0) - COALESCE(at.total_credits, 0)
              ELSE COALESCE(at.total_credits, 0) - COALESCE(at.total_debits, 0)
            END
          FROM account_totals at
          WHERE coa.code = at.account_code
            AND coa.tenant_id = $1
        `, [req.body?.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c']);
        
        result = 'GL account balances recalculated successfully from journal entries';
        break;
        
      case 'sales':
        // Create sales schema and customers table
        await pool.query(`
          -- Create sales schema
          CREATE SCHEMA IF NOT EXISTS sales;

          -- Customers Table
          CREATE TABLE IF NOT EXISTS sales.customers (
              customer_id SERIAL PRIMARY KEY,
              tenant_id UUID NOT NULL,
              customer_code VARCHAR(50),
              name VARCHAR(255) NOT NULL,
              company_name VARCHAR(255),
              contact_person VARCHAR(255),
              email VARCHAR(255),
              phone VARCHAR(50),
              mobile VARCHAR(50),
              vat_number VARCHAR(50),
              customer_type VARCHAR(50) DEFAULT 'retail',
              source VARCHAR(100),
              billing_address TEXT,
              shipping_address TEXT,
              city VARCHAR(100),
              province VARCHAR(100),
              postal_code VARCHAR(20),
              country VARCHAR(100) DEFAULT 'South Africa',
              payment_terms VARCHAR(100),
              credit_limit DECIMAL(12,2) DEFAULT 0.00,
              tax_id VARCHAR(50),
              industry VARCHAR(100),
              website VARCHAR(255),
              notes TEXT,
              assigned_to VARCHAR(255),
              status VARCHAR(20) DEFAULT 'active',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_sales_customers_tenant ON sales.customers(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_sales_customers_status ON sales.customers(status);
          CREATE INDEX IF NOT EXISTS idx_sales_customers_name ON sales.customers(name);
        `);
        
        // Seed sample customers for the tenant
        const salesTenantId = req.body?.tenantId || 'd0a49212-96f5-46c7-9d69-fec0f235a90c';
        await pool.query(`
          INSERT INTO sales.customers (tenant_id, customer_code, name, company_name, contact_person, email, phone, city, status)
          VALUES 
              ($1, 'CUST001', 'Pick n Pay Stores', 'Pick n Pay Holdings', 'John Smith', 'procurement@pnp.co.za', '+27 11 555 0001', 'Johannesburg', 'active'),
              ($1, 'CUST002', 'Shoprite Checkers', 'Shoprite Holdings Ltd', 'Sarah Williams', 'orders@shoprite.co.za', '+27 21 555 0002', 'Cape Town', 'active'),
              ($1, 'CUST003', 'Woolworths SA', 'Woolworths Holdings', 'Mike Johnson', 'supply@woolworths.co.za', '+27 11 555 0003', 'Johannesburg', 'active'),
              ($1, 'CUST004', 'Builders Warehouse', 'Massmart Holdings', 'Lisa Davis', 'orders@builderswarehouse.co.za', '+27 11 555 0004', 'Johannesburg', 'active'),
              ($1, 'CUST005', 'Dis-Chem Pharmacies', 'Dis-Chem Pharmacies Ltd', 'Peter Brown', 'procurement@dischem.co.za', '+27 11 555 0005', 'Midrand', 'active'),
              ($1, 'CUST006', 'Spar Group', 'Spar Group Ltd', 'Emma Wilson', 'orders@spar.co.za', '+27 31 555 0006', 'Durban', 'active'),
              ($1, 'CUST007', 'Game Stores', 'Massmart Holdings', 'David Taylor', 'supply@game.co.za', '+27 11 555 0007', 'Johannesburg', 'active'),
              ($1, 'CUST008', 'Makro SA', 'Massmart Holdings', 'Rachel Green', 'orders@makro.co.za', '+27 11 555 0008', 'Johannesburg', 'active')
          ON CONFLICT DO NOTHING
        `, [salesTenantId]);
        
        result = 'Sales schema and customers table created successfully with sample data';
        break;
      
      case 'user-invite':
        // Add columns needed for user invitation feature
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token) WHERE invitation_token IS NOT NULL`);
        // Update full_name from first_name and last_name
        await pool.query(`UPDATE users SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) WHERE full_name IS NULL`);
        result = 'User invitation columns added successfully';
        break;
      
      case 'projects':
        // Run 031_missing_tables.sql which includes projects, tasks, messages, etc.
        const projectSqlPath = path.join('/app', 'database', 'migrations', '031_missing_tables.sql');
        const projectSql = fs.readFileSync(projectSqlPath, 'utf8');
        await pool.query(projectSql);
        
        // Add missing columns that controllers expect
        await pool.query(`
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS id UUID;
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_code VARCHAR(50);
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS code VARCHAR(50);
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS spent DECIMAL(15,2) DEFAULT 0;
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
          ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'internal';
          
          -- Set id = project_id for controllers that use 'id'
          UPDATE projects SET id = project_id WHERE id IS NULL;
          UPDATE projects SET code = project_code WHERE code IS NULL;
          UPDATE projects SET project_name = name WHERE project_name IS NULL;
          
          -- Add trigger to keep id in sync
          CREATE OR REPLACE FUNCTION sync_project_id() RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.id IS NULL THEN
              NEW.id := NEW.project_id;
            END IF;
            IF NEW.id IS NULL THEN
              NEW.id := gen_random_uuid();
            END IF;
            IF NEW.project_id IS NULL THEN
              NEW.project_id := NEW.id;
            END IF;
            IF NEW.code IS NOT NULL AND NEW.project_code IS NULL THEN
              NEW.project_code := NEW.code;
            END IF;
            IF NEW.name IS NOT NULL AND NEW.project_name IS NULL THEN
              NEW.project_name := NEW.name;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          DROP TRIGGER IF EXISTS sync_project_id_trigger ON projects;
          CREATE TRIGGER sync_project_id_trigger BEFORE INSERT ON projects
          FOR EACH ROW EXECUTE FUNCTION sync_project_id();
          
          -- Add missing columns to project_tasks
          ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS id UUID;
          ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255);
          ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS task_name VARCHAR(255);
          ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS assignee_id UUID;
          ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10,2) DEFAULT 0;
          ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10,2) DEFAULT 0;
          
          UPDATE project_tasks SET id = task_id WHERE id IS NULL;
          UPDATE project_tasks SET title = name WHERE title IS NULL;
          UPDATE project_tasks SET task_name = name WHERE task_name IS NULL;
          UPDATE project_tasks SET assignee_id = assigned_to WHERE assignee_id IS NULL;
          
          -- Add trigger to keep task columns in sync
          CREATE OR REPLACE FUNCTION sync_task_fields() RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.id IS NULL THEN
              NEW.id := NEW.task_id;
            END IF;
            IF NEW.id IS NULL THEN
              NEW.id := gen_random_uuid();
            END IF;
            IF NEW.task_id IS NULL THEN
              NEW.task_id := NEW.id;
            END IF;
            IF NEW.title IS NOT NULL AND NEW.name IS NULL THEN
              NEW.name := NEW.title;
            END IF;
            IF NEW.name IS NOT NULL AND NEW.title IS NULL THEN
              NEW.title := NEW.name;
            END IF;
            IF NEW.name IS NOT NULL AND NEW.task_name IS NULL THEN
              NEW.task_name := NEW.name;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          DROP TRIGGER IF EXISTS sync_task_fields_trigger ON project_tasks;
          CREATE TRIGGER sync_task_fields_trigger BEFORE INSERT ON project_tasks
          FOR EACH ROW EXECUTE FUNCTION sync_task_fields();
        `);
        result = 'Projects, Messages, and related tables created successfully';
        break;
      
      case 'communications':
        // Create all communications hub tables
        await pool.query(`
          -- Announcements table
          CREATE TABLE IF NOT EXISTS announcements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author_id UUID,
            created_by_user_id UUID,
            department VARCHAR(100),
            priority VARCHAR(20) DEFAULT 'normal',
            status VARCHAR(20) DEFAULT 'draft',
            category VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE,
            is_pinned BOOLEAN DEFAULT FALSE,
            published_at TIMESTAMP,
            expires_at TIMESTAMP,
            view_count INTEGER DEFAULT 0,
            target_audience JSONB DEFAULT '[]',
            attachments JSONB DEFAULT '[]',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
          
          -- Chat channels
          CREATE TABLE IF NOT EXISTS chat_channels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            channel_type VARCHAR(20) DEFAULT 'public',
            is_active BOOLEAN DEFAULT TRUE,
            is_archived BOOLEAN DEFAULT FALSE,
            is_private BOOLEAN DEFAULT FALSE,
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_chat_channels_tenant ON chat_channels(tenant_id);
          ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
          
          -- Chat channel members
          CREATE TABLE IF NOT EXISTS chat_channel_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            role VARCHAR(20) DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT NOW(),
            last_read_at TIMESTAMP,
            UNIQUE(channel_id, user_id)
          );
          ALTER TABLE chat_channel_members ADD COLUMN IF NOT EXISTS tenant_id UUID;
          CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON chat_channel_members(channel_id);
          CREATE INDEX IF NOT EXISTS idx_channel_members_user ON chat_channel_members(user_id);
          
          -- Chat messages
          CREATE TABLE IF NOT EXISTS chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL,
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text',
            attachments JSONB DEFAULT '[]',
            mentions JSONB DEFAULT '[]',
            is_edited BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
          
          -- Direct messages
          CREATE TABLE IF NOT EXISTS direct_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            sender_id UUID NOT NULL,
            recipient_id UUID NOT NULL,
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text',
            attachments JSONB DEFAULT '[]',
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_dm_tenant ON direct_messages(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_dm_recipient ON direct_messages(recipient_id);
          
          -- User notifications
          CREATE TABLE IF NOT EXISTS user_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            user_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            notification_type VARCHAR(50) DEFAULT 'info',
            priority VARCHAR(20) DEFAULT 'normal',
            related_type VARCHAR(50),
            related_id UUID,
            action_url VARCHAR(500),
            metadata JSONB DEFAULT '{}',
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
          CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
          
          -- Video meetings
          CREATE TABLE IF NOT EXISTS video_meetings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            room_name VARCHAR(100) NOT NULL,
            room_url VARCHAR(500),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            meeting_type VARCHAR(30) DEFAULT 'instant',
            host_id UUID NOT NULL,
            scheduled_start TIMESTAMP,
            scheduled_end TIMESTAMP,
            actual_start TIMESTAMP,
            actual_end TIMESTAMP,
            max_participants INTEGER DEFAULT 50,
            is_private BOOLEAN DEFAULT FALSE,
            waiting_room BOOLEAN DEFAULT FALSE,
            recording_enabled BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'scheduled',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON video_meetings(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_meetings_host ON video_meetings(host_id);
          CREATE INDEX IF NOT EXISTS idx_meetings_status ON video_meetings(status);
          
          -- Video meeting participants
          CREATE TABLE IF NOT EXISTS video_meeting_participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            meeting_id UUID NOT NULL REFERENCES video_meetings(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            email VARCHAR(255),
            name VARCHAR(255),
            role VARCHAR(30) DEFAULT 'participant',
            status VARCHAR(20) DEFAULT 'invited',
            joined_at TIMESTAMP,
            left_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          );
          ALTER TABLE video_meeting_participants ADD COLUMN IF NOT EXISTS tenant_id UUID;
          ALTER TABLE video_meeting_participants ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'participant';
          CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON video_meeting_participants(meeting_id);
          CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON video_meeting_participants(user_id);
          
          -- Message templates
          CREATE TABLE IF NOT EXISTS message_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            subject VARCHAR(255),
            content TEXT NOT NULL,
            template_type VARCHAR(50) DEFAULT 'email',
            category VARCHAR(50),
            variables JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            usage_count INTEGER DEFAULT 0,
            last_used_at TIMESTAMP,
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_templates_tenant ON message_templates(tenant_id);
          
          -- Communication campaigns
          CREATE TABLE IF NOT EXISTS communication_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            campaign_type VARCHAR(50) DEFAULT 'email',
            template_id UUID REFERENCES message_templates(id),
            target_audience JSONB DEFAULT '{}',
            recipients_count INTEGER DEFAULT 0,
            sent_count INTEGER DEFAULT 0,
            delivered_count INTEGER DEFAULT 0,
            opened_count INTEGER DEFAULT 0,
            clicked_count INTEGER DEFAULT 0,
            scheduled_at TIMESTAMP,
            sent_at TIMESTAMP,
            completed_at TIMESTAMP,
            status VARCHAR(20) DEFAULT 'draft',
            stats JSONB DEFAULT '{}',
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON communication_campaigns(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_campaigns_status ON communication_campaigns(status);
          
          -- Communication contacts
          CREATE TABLE IF NOT EXISTS communication_contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            company VARCHAR(255),
            contact_type VARCHAR(50) DEFAULT 'general',
            tags JSONB DEFAULT '[]',
            groups JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            opt_in_email BOOLEAN DEFAULT TRUE,
            opt_in_sms BOOLEAN DEFAULT TRUE,
            opt_in_whatsapp BOOLEAN DEFAULT FALSE,
            is_subscribed BOOLEAN DEFAULT TRUE,
            last_contact_at TIMESTAMP,
            created_by UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON communication_contacts(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_contacts_email ON communication_contacts(email);
          
          -- Email inbox (for receiving/storing emails)
          CREATE TABLE IF NOT EXISTS email_inbox (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            message_id VARCHAR(255),
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255),
            to_email VARCHAR(255),
            to_addresses JSONB DEFAULT '[]',
            cc_addresses JSONB DEFAULT '[]',
            bcc_addresses JSONB DEFAULT '[]',
            subject VARCHAR(500),
            text_content TEXT,
            html_content TEXT,
            attachments JSONB DEFAULT '[]',
            headers JSONB DEFAULT '{}',
            folder VARCHAR(50) DEFAULT 'inbox',
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            is_starred BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            is_spam BOOLEAN DEFAULT FALSE,
            is_trash BOOLEAN DEFAULT FALSE,
            labels JSONB DEFAULT '[]',
            thread_id UUID,
            in_reply_to VARCHAR(255),
            received_at TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
          );
          -- Add columns if table exists with old schema
          ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS from_email VARCHAR(255);
          ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS to_email VARCHAR(255);
          ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS text_content TEXT;
          ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS html_content TEXT;
          ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
          CREATE INDEX IF NOT EXISTS idx_email_inbox_tenant ON email_inbox(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_email_inbox_folder ON email_inbox(folder);
          CREATE INDEX IF NOT EXISTS idx_email_inbox_from ON email_inbox(from_email);
          CREATE INDEX IF NOT EXISTS idx_email_inbox_thread ON email_inbox(thread_id);
          
          -- Email sent (for sent emails)
          CREATE TABLE IF NOT EXISTS email_sent (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            sender_id UUID NOT NULL,
            message_id VARCHAR(255),
            resend_id VARCHAR(255),
            recipient_email JSONB DEFAULT '[]',
            cc_emails JSONB DEFAULT '[]',
            bcc_emails JSONB DEFAULT '[]',
            from_address VARCHAR(255),
            subject VARCHAR(500),
            content TEXT,
            html_content TEXT,
            attachments JSONB DEFAULT '[]',
            template_id UUID,
            campaign_id UUID,
            reply_to_id UUID,
            status VARCHAR(20) DEFAULT 'queued',
            sent_at TIMESTAMP,
            delivered_at TIMESTAMP,
            opened_at TIMESTAMP,
            clicked_at TIMESTAMP,
            bounced_at TIMESTAMP,
            error_message TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
          );
          -- Add columns if table exists with old schema
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS sender_id UUID;
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS recipient_email JSONB DEFAULT '[]';
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS cc_emails JSONB DEFAULT '[]';
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS bcc_emails JSONB DEFAULT '[]';
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS content TEXT;
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS html_content TEXT;
          ALTER TABLE email_sent ADD COLUMN IF NOT EXISTS reply_to_id UUID;
          CREATE INDEX IF NOT EXISTS idx_email_sent_tenant ON email_sent(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_email_sent_sender ON email_sent(sender_id);
          CREATE INDEX IF NOT EXISTS idx_email_sent_status ON email_sent(status);
          
          -- Create General channel for existing tenants
          INSERT INTO chat_channels (tenant_id, name, description, channel_type)
          SELECT id, 'General', 'General discussion channel', 'public'
          FROM tenants
          WHERE NOT EXISTS (
            SELECT 1 FROM chat_channels cc WHERE cc.tenant_id = tenants.id AND cc.name = 'General'
          );
        `);
        result = 'Communications Hub tables created successfully (announcements, channels, messages, meetings, templates, campaigns, contacts, email inbox/sent)';
        break;
        
      default:
        return res.status(400).json({ success: false, error: `Unknown module: ${module}` });
    }
    res.json({ success: true, message: result });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Intentional error route for local testing of the error handler (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-error', () => {
    throw new Error('Intentional test error');
  });
}

// Swagger/OpenAPI docs for Logistics module
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Versioning (GAP-014)
const v1Router = express.Router();

// API Routes
// Authentication (public routes with strict rate limiting)
v1Router.use('/auth', authLimiter, authRoutes);

// Onboarding routes (protected with API rate limiting)
v1Router.use('/onboarding', apiLimiter, onboardingRoutes);

// Module discovery routes (backend-driven UI)
v1Router.use('/modules', apiLimiter, modulesRoutes);

// Email preferences routes (mixed public/protected with API rate limiting)
v1Router.use('/email-preferences', apiLimiter, emailPreferencesRoutes);

// Email queue admin routes (protected with admin rate limiting) - DISABLED - uses Bull/Redis
// v1Router.use('/admin/email-queue', adminLimiter, emailQueueRoutes);

// Tenant settings routes (protected with API rate limiting)
v1Router.use('/tenant', apiLimiter, tenantSettingsRoutes);

// Payment routes (public and protected with API rate limiting)
// TEMPORARILY DISABLED - Missing Stripe API keys
// v1Router.use('/payment', apiLimiter, paymentRoutes);

// Subscription routes (protected with API rate limiting)
// TEMPORARILY DISABLED - Depends on payment routes
// v1Router.use('/subscription', apiLimiter, subscriptionRoutes);

// Webhook routes (public, no auth - for payment gateway callbacks with webhook rate limiting)
// TEMPORARILY DISABLED - Depends on payment services
// v1Router.use('/webhooks', webhookLimiter, webhookRoutes);

// Super Admin routes (protected by super admin auth with admin rate limiting)
v1Router.use('/admin', adminLimiter, superAdminRoutes);

// Admin routes (user management, roles, permissions, settings)
v1Router.use('/admin', adminLimiter, adminRoutes);

// Demo routes (with demo rate limiting) - DISABLED - causes Bull/Redis initialization
// v1Router.use('/demo', demoLimiter, demoResetRoutes);

// Protected module routes (with API rate limiting)
v1Router.use('/inventory', apiLimiter, inventoryRoutes);
v1Router.use('/sales', apiLimiter, salesRoutes);
v1Router.use('/purchase', apiLimiter, purchaseRoutes);
v1Router.use('/financial', apiLimiter, financialRoutes);
v1Router.use('/financial/dimensions', dimensionsRoutes);
v1Router.use('/financial/periods', periodRoutes);
v1Router.use(
  '/financial/dashboard',
  createCacheMiddleware({ prefix: 'financial:dashboard', ttlSeconds: 60 }),
  dashboardRoutes
);
v1Router.use('/financial/approvals', approvalRoutes);
v1Router.use('/hr', hrRoutes);
v1Router.use('/manufacturing', manufacturingRoutes);
v1Router.use('/warehouse', warehouseRoutes);
v1Router.use('/sars-sentinel', sarsSentinelRoutes);
v1Router.use('/cash-management', cashManagementRoutes);
// Old financial reports routes - replaced by new module routes below
// v1Router.use('/financial/reports', financialReportsRoutes);
v1Router.use('/financial/recurring-entries', recurringEntriesRoutes);
v1Router.use('/financial/import-entries', importEntriesRoutes);
v1Router.use('/financial/gl-explorer', glExplorerRoutes);
v1Router.use('/financial/audit-trail', auditTrailRoutes);
v1Router.use('/financial/tax-settings', taxSettingsRoutes);
v1Router.use('/financial/forecasting', financialForecastingRoutes);
v1Router.use('/financial/custom-reports', customReportsRoutes);
v1Router.use('/practice', practiceRoutes);
v1Router.use('/assets', assetsRoutes); // Legacy Asset Management routes (workspace, old controllers)
v1Router.use(
  '/logistics',
  authenticateToken,
  tenantMiddleware,
  apiLimiter,
  auditMiddleware({ entityType: 'logistics' }),
  logisticsRoutes
); // Logistics routes (RBAC protected + Audit)
v1Router.use('/audit-log', apiLimiter, auditLogRoutes); // Audit Log API (SOX compliance)
v1Router.use('/compliance', apiLimiter, complianceRoutes); // Compliance & Governance
v1Router.use('/audit', apiLimiter, auditReadyRoutes); // Audit-Ready Suite
v1Router.use('/reports', apiLimiter, reportsRoutes); // Reports & Analytics
v1Router.use('/ai', apiLimiter, aiAssistantRoutes); // AI Agents & Assistants
v1Router.use('/agent', agentRoutes); // Actionable AI Agent (can create invoices, etc.)
v1Router.use('/entities', apiLimiter, multiEntityRoutes); // Multi-Entity Management
v1Router.use('/healthcare', apiLimiter, healthcareRoutes); // Healthcare Operations Intelligence
v1Router.use('/super-admin', apiLimiter, superadminRoutes); // Super Admin & Multi-Tenant Support Portal
v1Router.use('/chart-of-accounts', apiLimiter, chartOfAccountsRoutes); // Chart of Accounts
// New Financial Reports Module - Trial Balance, P&L, Balance Sheet
v1Router.use('/financial', apiLimiter, financialReportsRoutes2); // Financial Reporting API
v1Router.use('/invoices/sales', apiLimiter, salesInvoiceRoutes); // Sales Invoice API
v1Router.use('/purchases', apiLimiter, purchaseInvoiceRoutes); // Purchase Invoice API
v1Router.use('/asset-management', apiLimiter, assetManagementRoutes); // Asset Management API
v1Router.use('/messages', apiLimiter, messagesRoutes); // Driver-Dispatch Messaging
v1Router.use('/delivery', apiLimiter, deliveryRoutes); // Delivery Verification & POD
v1Router.use('/meetings', apiLimiter, meetingsRoutes); // Video Conferencing (Daily.co)

// NEW API ROUTES - December 2025
v1Router.use('/projects', apiLimiter, projectsRoutes); // Project Management API
v1Router.use('/proposals', apiLimiter, proposalsRoutes); // Proposals & Quotes API
v1Router.use('/communications', apiLimiter, communicationsRoutes); // Communications Hub API
v1Router.use('/calendar', apiLimiter, calendarRoutes); // Calendar & Events API
v1Router.use('/mining', apiLimiter, miningRoutes); // Mining Industry API
v1Router.use('/agriculture', apiLimiter, agricultureRoutes); // Agriculture Industry API
v1Router.use('/construction', apiLimiter, constructionRoutes); // Construction Industry API
v1Router.use('/property', apiLimiter, propertyRoutes); // Property Management API

// V2 Routes - Tenant-Hardened API (multi-tenant secure)
// These routes use v2 controllers with proper tenant isolation
v1Router.use('/v2', apiLimiter, v2Routes);

// Mount v1 router
app.use('/api/v1', v1Router);
// Backward compatibility
app.use('/api', v1Router);

// Error handling middleware
// Error handling middleware
app.use(errorHandler);

// Initialize WebSocket gateway (GAP-010)
initializeLogisticsGateway(httpServer);

// Listen on all interfaces (0.0.0.0) to accept external connections
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Accepting connections on all interfaces (0.0.0.0:${PORT})`);
  console.log(`📊 ERP System initialized`);
  console.log(`🔌 Socket.IO gateway active at /logistics-ws`);
  
  // Initialize demo tenant auto-reset cron job (DISABLED - Redis not configured)
  // DemoResetService.initializeCronJob();
  // console.log(`🔄 Demo reset service initialized - Daily reset at 2:00 AM`);
  console.log(`⚠️  Demo reset service disabled (Redis not configured)`);
});

export default app;

