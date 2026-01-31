/**
 * Repository Index
 * 
 * Exports all module repositories for easy importing.
 * Usage: import { ItemCategoryRepository, CustomerRepository } from '@/repositories';
 */

// Base
export { BaseRepository, TenantContext, PaginationOptions, PaginatedResult, QueryOptions } from './BaseRepository';

// Inventory
export { ItemCategoryRepository, itemCategoryRepository } from './inventory/ItemCategoryRepository';
export { InventoryItemRepository, inventoryItemRepository } from './inventory/InventoryItemRepository';
export { WarehouseRepository, warehouseRepository } from './inventory/WarehouseRepository';
export { StockMovementRepository, stockMovementRepository } from './inventory/StockMovementRepository';

// Sales
export { CustomerRepository, customerRepository } from './sales/CustomerRepository';
export { SalesOrderRepository, salesOrderRepository } from './sales/SalesOrderRepository';
export { InvoiceRepository, invoiceRepository } from './sales/InvoiceRepository';
export { QuotationRepository, quotationRepository } from './sales/QuotationRepository';

// Purchase
export { SupplierRepository, supplierRepository } from './purchase/SupplierRepository';
export { PurchaseOrderRepository, purchaseOrderRepository } from './purchase/PurchaseOrderRepository';
export { PurchaseInvoiceRepository, purchaseInvoiceRepository } from './purchase/PurchaseInvoiceRepository';

// Financial
export { AccountRepository, accountRepository } from './financial/AccountRepository';
export { JournalEntryRepository, journalEntryRepository } from './financial/JournalEntryRepository';
export { BankAccountRepository, bankAccountRepository } from './financial/BankAccountRepository';
export { BudgetRepository, budgetRepository } from './financial/BudgetRepository';

// HR
export { EmployeeRepository, employeeRepository } from './hr/EmployeeRepository';
export { DepartmentRepository, departmentRepository } from './hr/DepartmentRepository';
export { LeaveRequestRepository, leaveRequestRepository } from './hr/LeaveRequestRepository';
export { PayrollRepository, payrollRepository } from './hr/PayrollRepository';

// Assets
export { AssetRepository, assetRepository } from './assets/AssetRepository';
export { AssetCategoryRepository, assetCategoryRepository } from './assets/AssetCategoryRepository';
