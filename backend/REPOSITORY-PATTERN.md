# Repository Pattern Implementation Guide

## Overview

This document explains the Repository Pattern implementation for the WorldClass ERP system's multi-tenant architecture.

## Why Repository Pattern?

In a multi-tenant ERP system, **data isolation is critical**. Each tenant must only see their own data. The repository pattern provides:

1. **Automatic Tenant Isolation** - Every query automatically includes `WHERE tenant_id = ?`
2. **DRY Principle** - Write tenant filtering logic once, use everywhere
3. **Type Safety** - TypeScript interfaces for all entities
4. **Audit Trail** - Automatic `created_by`, `updated_by`, `created_at`, `updated_at`
5. **Soft Delete** - Records aren't deleted, just marked with `deleted_at`
6. **Testability** - Easy to mock repositories for unit testing
7. **Clean Architecture** - Separation of concerns between controllers and data access

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Controller                               │
│  (Handles HTTP requests, validates input, returns responses)     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Repository                               │
│  (Handles all database operations with automatic tenant filter)  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PostgreSQL                               │
│  (Stores data with tenant_id on every business table)           │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/backend/src/repositories/
├── BaseRepository.ts          # Abstract base class with common operations
├── index.ts                   # Re-exports all repositories
├── inventory/
│   ├── index.ts
│   ├── ItemCategoryRepository.ts
│   ├── InventoryItemRepository.ts
│   ├── WarehouseRepository.ts
│   └── StockMovementRepository.ts
├── sales/
│   ├── index.ts
│   ├── CustomerRepository.ts
│   ├── SalesOrderRepository.ts
│   ├── InvoiceRepository.ts
│   └── QuotationRepository.ts
├── purchase/
│   ├── index.ts
│   ├── SupplierRepository.ts
│   ├── PurchaseOrderRepository.ts
│   └── PurchaseInvoiceRepository.ts
├── financial/
│   ├── index.ts
│   ├── AccountRepository.ts
│   ├── JournalEntryRepository.ts
│   ├── BankAccountRepository.ts
│   └── BudgetRepository.ts
├── hr/
│   ├── index.ts
│   ├── EmployeeRepository.ts
│   ├── DepartmentRepository.ts
│   ├── LeaveRequestRepository.ts
│   └── PayrollRepository.ts
└── assets/
    ├── index.ts
    ├── AssetRepository.ts
    └── AssetCategoryRepository.ts
```

## Usage Guide

### 1. Import the Repository

```typescript
import { customerRepository, TenantContext } from '../repositories';
// or
import { CustomerRepository } from '../repositories/sales/CustomerRepository';
```

### 2. Create TenantContext from Request

```typescript
import { TenantRequest } from '../middleware/tenant';

function getTenantContext(req: TenantRequest): TenantContext {
  if (!req.tenant) {
    throw new Error('Tenant context not available');
  }
  return {
    tenantId: req.tenant.id,
    userId: req.user?.id
  };
}
```

### 3. Use Repository Methods

```typescript
export const getCustomers = async (req: TenantRequest, res: Response) => {
  const ctx = getTenantContext(req);
  
  // Find all customers (automatically filtered by tenant)
  const result = await customerRepository.findAll(ctx, {}, {
    page: 1,
    limit: 50,
    sortBy: 'name',
    sortOrder: 'ASC'
  });
  
  res.json({ success: true, data: result.data, pagination: result.pagination });
};

export const createCustomer = async (req: TenantRequest, res: Response) => {
  const ctx = getTenantContext(req);
  
  // Create automatically adds tenant_id, created_by, created_at
  const customer = await customerRepository.create(ctx, {
    name: req.body.name,
    email: req.body.email,
    // tenant_id is added automatically!
  });
  
  res.status(201).json({ success: true, data: customer });
};
```

## BaseRepository Methods

### CRUD Operations

| Method | Description |
|--------|-------------|
| `findAll(ctx, filters, pagination)` | Get all records with pagination |
| `findById(ctx, id)` | Get single record by ID |
| `findBy(ctx, field, value)` | Get records by field value |
| `findOne(ctx, criteria)` | Get first matching record |
| `create(ctx, data)` | Create new record |
| `createMany(ctx, records)` | Create multiple records |
| `update(ctx, id, data)` | Update record |
| `delete(ctx, id)` | Soft delete record |
| `count(ctx, filters)` | Count records |
| `exists(ctx, criteria)` | Check if record exists |

### Transaction Support

```typescript
const client = await repository.beginTransaction();
try {
  await repository.create(ctx, data1, { client });
  await repository.create(ctx, data2, { client });
  await repository.commitTransaction(client);
} catch (error) {
  await repository.rollbackTransaction(client);
  throw error;
}
```

### Raw Queries (when needed)

```typescript
// Always include tenant_id as first parameter placeholder
const results = await repository.rawQuery(ctx, 
  `SELECT * FROM my_table 
   WHERE tenant_id = $1 AND custom_field = $2`,
  [customValue]  // tenant_id is prepended automatically
);
```

## Creating a New Repository

1. **Create the interface**:

```typescript
export interface MyEntity {
  id: string;
  tenant_id: string;
  name: string;
  // ... other fields
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}
```

2. **Extend BaseRepository**:

```typescript
export class MyEntityRepository extends BaseRepository<MyEntity> {
  protected tableName = 'my_entities';
  protected schema = 'my_schema';
  
  // Add custom methods
  async customMethod(ctx: TenantContext): Promise<MyEntity[]> {
    return this.rawQuery(ctx, 
      `SELECT * FROM ${this.fullTableName} WHERE tenant_id = $1 AND custom_condition`
    );
  }
}

export const myEntityRepository = new MyEntityRepository();
```

3. **Export from index**:

```typescript
// In repositories/my_module/index.ts
export { MyEntityRepository, myEntityRepository } from './MyEntityRepository';
```

## Migration from Old Controllers

### Before (NO tenant isolation):

```typescript
export const getCustomers = async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM sales.customers');
  res.json(result.rows);  // ⚠️ Returns ALL tenants' data!
};
```

### After (WITH tenant isolation):

```typescript
export const getCustomers = async (req: TenantRequest, res: Response) => {
  const ctx = getTenantContext(req);
  const result = await customerRepository.findAll(ctx);
  res.json(result.data);  // ✅ Only this tenant's data
};
```

## Best Practices

1. **Never access pool directly in controllers** - Always use repositories
2. **Always use TenantRequest type** - Not plain Request
3. **Create TenantContext at start of handler** - Fail fast if missing
4. **Use transactions for multi-table operations** - Ensure data consistency
5. **Add custom methods for complex queries** - Keep controllers clean
6. **Export singleton instances** - `export const repo = new Repo()`

## Security Considerations

- The middleware verifies the JWT and extracts tenant_id
- Repository methods ALWAYS include `WHERE tenant_id = $1`
- Even raw queries require the ctx parameter
- Audit fields track who created/modified records
- Soft delete preserves audit trail

## Testing

```typescript
// Mock the repository for unit tests
jest.mock('../repositories/sales/CustomerRepository', () => ({
  customerRepository: {
    findAll: jest.fn().mockResolvedValue({ data: [], pagination: {...} }),
    create: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
  }
}));
```

## Files Updated

- Created: `/backend/src/repositories/BaseRepository.ts`
- Created: `/backend/src/repositories/index.ts`
- Created: `/backend/src/repositories/inventory/*`
- Created: `/backend/src/repositories/sales/*`
- Created: `/backend/src/repositories/purchase/*`
- Created: `/backend/src/repositories/financial/*`
- Created: `/backend/src/repositories/hr/*`
- Created: `/backend/src/repositories/assets/*`
- Created: `/backend/src/controllers/inventory.controller.v2.ts` (example)

## Next Steps

1. Migrate all controllers to use repositories
2. Update route handlers to use TenantRequest
3. Add database indexes on tenant_id columns
4. Add RLS policies as additional security layer
5. Create unit tests for repositories
