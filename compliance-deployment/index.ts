import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
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
import manufacturingRoutes from './routes/manufacturing.routes';
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
import demoResetRoutes from './routes/demo-reset.routes';
import superAdminRoutes from './routes/super-admin.routes';
import adminRoutes from './routes/admin.routes';
import complianceRoutes from './routes/compliance.routes';
import auditReadyRoutes from './routes/audit-ready.routes';
import DemoResetService from './services/demo-reset.service';
import { securityHeaders, securityLogger } from './middleware/security';
import { apiLimiter, authLimiter, adminLimiter, webhookLimiter, demoLimiter } from './middleware/rateLimiter';
import logisticsRoutes from './modules/logistics/logistics.routes';
import gpsRoutes from './modules/logistics/gps.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
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

// API Routes
// Authentication (public routes with strict rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// Onboarding routes (protected with API rate limiting)
app.use('/api/onboarding', apiLimiter, onboardingRoutes);

// Email preferences routes (mixed public/protected with API rate limiting)
app.use('/api/email-preferences', apiLimiter, emailPreferencesRoutes);

// Email queue admin routes (protected with admin rate limiting)
app.use('/api/admin/email-queue', adminLimiter, emailQueueRoutes);

// Tenant settings routes (protected with API rate limiting)
app.use('/api/tenant', apiLimiter, tenantSettingsRoutes);

// Payment routes (public and protected with API rate limiting)
// TEMPORARILY DISABLED - Missing Stripe API keys
// app.use('/api/payment', apiLimiter, paymentRoutes);

// Subscription routes (protected with API rate limiting)
// TEMPORARILY DISABLED - Depends on payment routes
// app.use('/api/subscription', apiLimiter, subscriptionRoutes);

// Webhook routes (public, no auth - for payment gateway callbacks with webhook rate limiting)
// TEMPORARILY DISABLED - Depends on payment services
// app.use('/api/webhooks', webhookLimiter, webhookRoutes);

// Super Admin routes (protected by super admin auth with admin rate limiting)
app.use('/api/admin', adminLimiter, superAdminRoutes);

// Admin routes (user management, roles, permissions, settings)
app.use('/api/admin', adminLimiter, adminRoutes);

// Demo routes (with demo rate limiting)
app.use('/api/demo', demoLimiter, demoResetRoutes);

// Protected module routes (with API rate limiting)
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/sales', apiLimiter, salesRoutes);
app.use('/api/purchase', apiLimiter, purchaseRoutes);
app.use('/api/financial', apiLimiter, financialRoutes);
app.use('/api/financial/dimensions', dimensionsRoutes);
app.use('/api/financial/periods', periodRoutes);
app.use('/api/financial/dashboard', dashboardRoutes);
app.use('/api/financial/approvals', approvalRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/sars-sentinel', sarsSentinelRoutes);
app.use('/api/cash-management', cashManagementRoutes);
app.use('/api/financial/reports', financialReportsRoutes);
app.use('/api/financial/recurring-entries', recurringEntriesRoutes);
app.use('/api/financial/import-entries', importEntriesRoutes);
app.use('/api/financial/gl-explorer', glExplorerRoutes);
app.use('/api/financial/audit-trail', auditTrailRoutes);
app.use('/api/financial/tax-settings', taxSettingsRoutes);
app.use('/api/financial/forecasting', financialForecastingRoutes);
app.use('/api/financial/custom-reports', customReportsRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api', assetsRoutes); // Asset Management routes
app.use('/api/logistics', logisticsRoutes); // Logistics routes
app.use('/api', gpsRoutes); // GPS webhook routes
app.use('/api/compliance', apiLimiter, complianceRoutes); // Compliance & Governance
app.use('/api/audit', apiLimiter, auditReadyRoutes); // Audit-Ready Suite

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 ERP System initialized`);
  
  // Initialize demo tenant auto-reset cron job
  DemoResetService.initializeCronJob();
  console.log(`🔄 Demo reset service initialized - Daily reset at 2:00 AM`);
});

export default app;

