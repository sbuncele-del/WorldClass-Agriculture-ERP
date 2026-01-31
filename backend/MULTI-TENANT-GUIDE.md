# 🔧 MULTI-TENANT SYSTEM - DEVELOPER GUIDE

## 📚 Quick Reference

### 1. Using Tenant Middleware in Routes

```typescript
import { Router } from 'express';
import { tenantMiddleware, requireRole, requireFeature } from '../middleware/tenant';

const router = Router();

// Basic tenant protection (any authenticated user)
router.get('/api/customers', tenantMiddleware, getCustomers);

// Role-based access (only admins and managers)
router.post('/api/settings', 
  tenantMiddleware, 
  requireRole('admin', 'manager'), 
  updateSettings
);

// Feature-gated endpoint (requires AI automation feature)
router.post('/api/ai/reconcile', 
  tenantMiddleware, 
  requireFeature('ai_automation'), 
  autoReconcile
);

// Super admin only (platform management)
router.get('/api/admin/tenants', 
  tenantMiddleware, 
  superAdminOnly, 
  getAllTenants
);

// Block writes in demo mode
router.post('/api/transactions', 
  tenantMiddleware, 
  blockDemoWrites, 
  createTransaction
);
```

### 2. Accessing Tenant Context in Controllers

```typescript
import { Response } from 'express';
import { TenantRequest } from '../types';

export const getCustomers = async (req: TenantRequest, res: Response) => {
  // Access tenant information
  const tenantId = req.tenant!.id;
  const tenantName = req.tenant!.name;
  const features = req.tenant!.features;
  
  // Access user information
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const userEmail = req.user!.email;
  
  // Query with tenant isolation
  const customers = await pool.query(
    'SELECT * FROM customers WHERE tenant_id = $1',
    [tenantId]
  );
  
  res.json(customers.rows);
};
```

### 3. Database Queries with Tenant Isolation

**CRITICAL: ALL queries MUST include tenant_id filter!**

```typescript
// ✅ CORRECT - Includes tenant_id
const result = await pool.query(
  'SELECT * FROM invoices WHERE tenant_id = $1 AND status = $2',
  [req.tenant!.id, 'paid']
);

// ❌ WRONG - Missing tenant_id (data leak!)
const result = await pool.query(
  'SELECT * FROM invoices WHERE status = $1',
  ['paid']
);

// ✅ CORRECT - INSERT with tenant_id
await pool.query(
  'INSERT INTO customers (tenant_id, name, email) VALUES ($1, $2, $3)',
  [req.tenant!.id, 'Acme Corp', 'info@acme.com']
);

// ✅ CORRECT - UPDATE with tenant_id
await pool.query(
  'UPDATE products SET price = $1 WHERE id = $2 AND tenant_id = $3',
  [99.99, productId, req.tenant!.id]
);

// ✅ CORRECT - DELETE with tenant_id
await pool.query(
  'DELETE FROM orders WHERE id = $1 AND tenant_id = $2',
  [orderId, req.tenant!.id]
);
```

### 4. Using Tenant Service

```typescript
import TenantService from '../services/tenant.service';

// Get tenant by ID
const tenant = await TenantService.getById(tenantId);

// Get tenant by slug
const tenant = await TenantService.getBySlug('acme-corp');

// Check if slug is available
const available = await TenantService.isSlugAvailable('new-company');

// Create new tenant
const newTenant = await TenantService.create({
  name: 'Acme Corporation',
  slug: 'acme-corp',
  billing_email: 'billing@acme.com',
  subscription_plan: 'professional'
});

// Update tenant
const updated = await TenantService.update(tenantId, {
  status: 'active',
  max_users: 50
});

// Suspend tenant
await TenantService.suspend(tenantId, 'Non-payment');

// Get tenant statistics
const stats = await TenantService.getStats(tenantId);
// Returns: { users: 12, invoices: 450, customers: 89, storageUsedMb: 245 }

// Check if tenant can add more users
const canAdd = await TenantService.canAddUser(tenantId);

// Extend trial period
await TenantService.extendTrial(tenantId, 7); // Add 7 days

// Activate subscription after payment
await TenantService.activateSubscription(tenantId, 'enterprise');
```

### 5. Role-Based Access Examples

```typescript
// Define roles in order of privilege
const ROLES = {
  SUPER_ADMIN: 'super_admin',  // Platform administrator
  ADMIN: 'admin',               // Tenant administrator
  MANAGER: 'manager',           // Department manager
  USER: 'user',                 // Regular employee
  VIEWER: 'viewer'              // Read-only access
};

// Check user role
if (req.user!.role === 'admin') {
  // Allow full access
}

// Check permissions
if (req.user!.permissions.includes('customers.delete')) {
  // Allow customer deletion
}
```

### 6. Feature Flags

```typescript
// Check if tenant has feature enabled
if (req.tenant!.features.ai_automation) {
  // Run AI automation
}

if (req.tenant!.features.multi_currency) {
  // Show multi-currency options
}

// Available features:
// - ai_automation
// - multi_currency
// - advanced_reporting
// - api_access
// - custom_branding
```

### 7. Subscription Plans

```typescript
// Plan limits
const PLANS = {
  starter: {
    maxUsers: 5,
    maxStorageGb: 5,
    features: ['core_modules', 'email_support']
  },
  professional: {
    maxUsers: 25,
    maxStorageGb: 50,
    features: ['all_modules', 'ai_automation', 'priority_support']
  },
  enterprise: {
    maxUsers: 9999,
    maxStorageGb: 9999,
    features: ['all_modules', 'ai_automation', 'api_access', 'custom_branding', 'dedicated_manager']
  }
};

// Check plan limits
const tenant = await TenantService.getById(tenantId);
if (tenant.subscription_plan === 'starter') {
  // Limit features
}
```

### 8. Demo Mode Handling

```typescript
// Check if demo tenant
const isDemo = await pool.query(
  'SELECT id FROM demo_tenants WHERE tenant_id = $1',
  [req.tenant!.id]
);

if (isDemo.rows.length > 0) {
  // Show demo banner
  // Block certain actions
  // Show "Sign up" prompts
}
```

### 9. Audit Logging

```typescript
// Audit log is automatic for all non-GET requests
// But you can manually log important actions:

await pool.query(
  `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, old_values, new_values)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [
    req.tenant!.id,
    req.user!.id,
    'customer_deleted',
    'customer',
    customerId,
    { name: 'Old Name' },
    null
  ]
);
```

### 10. JWT Token Structure

```typescript
// Access Token Payload
{
  userId: 'uuid',
  tenantId: 'uuid',
  email: 'user@example.com',
  role: 'admin',
  type: 'access',
  exp: 1234567890  // 1 hour expiry
}

// Refresh Token Payload
{
  userId: 'uuid',
  tenantId: 'uuid',
  type: 'refresh',
  exp: 1234567890  // 7 days expiry
}
```

## 🔒 Security Checklist

- [x] Always include `tenant_id` in WHERE clauses
- [x] Validate tenant is active before processing requests
- [x] Check user has required role/permissions
- [x] Log sensitive operations to audit_log
- [x] Use parameterized queries (prevent SQL injection)
- [x] Validate input data
- [x] Handle errors gracefully
- [x] Don't expose internal IDs in error messages
- [x] Rate limit API endpoints
- [x] Validate JWT tokens properly

## 🧪 Testing Multi-Tenant Isolation

```typescript
// Test Case: Tenant A cannot access Tenant B's data
describe('Tenant Isolation', () => {
  it('should not allow access to other tenant data', async () => {
    // Login as Tenant A
    const tokenA = await login('userA@tenantA.com', 'password');
    
    // Try to access Tenant B's customer
    const response = await request(app)
      .get('/api/customers/tenant-b-customer-id')
      .set('Authorization', `Bearer ${tokenA}`);
    
    expect(response.status).toBe(404); // Should not find
  });
});
```

## 📊 Common Queries

```sql
-- Get all tenants with user count
SELECT 
  t.id, t.name, t.slug, t.status,
  COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
WHERE t.deleted_at IS NULL
GROUP BY t.id;

-- Get tenant's monthly recurring revenue
SELECT 
  SUM(
    CASE 
      WHEN billing_cycle = 'monthly' THEN 
        CASE subscription_plan
          WHEN 'starter' THEN 499
          WHEN 'professional' THEN 1999
          WHEN 'enterprise' THEN 4999
        END
      WHEN billing_cycle = 'annual' THEN 
        CASE subscription_plan
          WHEN 'starter' THEN 4990/12
          WHEN 'professional' THEN 19990/12
          WHEN 'enterprise' THEN 49990/12
        END
    END
  ) as mrr
FROM tenants
WHERE status = 'active' AND subscription_status = 'active';

-- Get expiring trials (next 7 days)
SELECT id, name, email, trial_ends_at
FROM tenants
WHERE status = 'trial' 
  AND trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY trial_ends_at;
```

## 🚀 Deployment Checklist

1. [ ] Run `./deploy-schema.sh` to deploy database schema
2. [ ] Verify demo tenant exists
3. [ ] Test login with demo credentials
4. [ ] Update all existing queries to include tenant_id
5. [ ] Add tenant middleware to all protected routes
6. [ ] Test data isolation between tenants
7. [ ] Set up monitoring for tenant metrics
8. [ ] Configure backup strategy
9. [ ] Test subscription activation flow
10. [ ] Document API endpoints with tenant context

---

**Questions?** Check PRODUCTION-READINESS-PLAN.md for full implementation guide.
