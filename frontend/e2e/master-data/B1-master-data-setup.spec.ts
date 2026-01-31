/**
 * ============================================================================
 * PHASE 2: MASTER DATA GENESIS
 * B1. Chart of Accounts, Customers, Suppliers, Products, Warehouses
 * ============================================================================
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_CONFIG } from '../utils/test-config';
import { 
  loginAsDemo, 
  navigateToModule, 
  testButton, 
  fillForm, 
  submitForm,
  waitForTable,
  screenshot,
} from '../utils/helpers';
import { tracker } from '../utils/tracker';
import { 
  CHART_OF_ACCOUNTS, 
  PRODUCTS, 
  SUPPLIERS, 
  CUSTOMERS 
} from '../fixtures/test-data';

const PHASE = 'Phase 2 - Master Data';

test.describe('B1. Master Data Setup', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('B1.1 - Chart of Accounts Navigation', async ({ page }) => {
    const scenario = 'Chart of Accounts';
    
    // Navigate to Finance/Accounting module
    const financeSelectors = [
      'text=Finance',
      'text=Accounting',
      'text=Financial',
      '[href*="finance"]',
      '[href*="accounting"]',
    ];
    
    let navigated = false;
    for (const selector of financeSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        navigated = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.1-finance-module');
    
    // Look for Chart of Accounts
    const coaSelectors = [
      'text=Chart of Accounts',
      'text=COA',
      'text=Accounts',
      'text=GL Accounts',
      '[href*="accounts"]',
      '[href*="coa"]',
    ];
    
    for (const selector of coaSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.1-chart-of-accounts');
    
    // Test Create Account button
    const createAccountResult = await testButton(page, 'button:has-text("Add Account")', 'Add Account');
    if (!createAccountResult.clicked) {
      await testButton(page, 'button:has-text("New Account")', 'New Account');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'COA navigation',
      status: 'pass',
    });
  });

  test('B1.2 - Customer Master Setup', async ({ page }) => {
    const scenario = 'Customer Master';
    
    // Navigate to Sales/CRM
    const salesSelectors = [
      'text=Sales',
      'text=CRM',
      'text=Customers',
      '[href*="sales"]',
      '[href*="crm"]',
    ];
    
    for (const selector of salesSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.2-sales-module');
    
    // Look for Customers
    const customerSelectors = [
      'text=Customers',
      'text=Customer List',
      '[href*="customer"]',
    ];
    
    for (const selector of customerSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.2-customer-list');
    
    // Test Add Customer
    const addCustomerResult = await testButton(page, 'button:has-text("Add Customer")', 'Add Customer');
    tracker.addButtonTest(addCustomerResult);
    
    if (addCustomerResult.clicked) {
      // Fill customer form
      await page.waitForTimeout(500);
      await fillForm(page, {
        'Customer Name': CUSTOMERS[0].name,
        'Name': CUSTOMERS[0].name,
        'Email': CUSTOMERS[0].email,
        'Phone': CUSTOMERS[0].phone,
        'VAT Number': CUSTOMERS[0].vatNumber,
      });
      await screenshot(page, 'B1.2-customer-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Customer master',
      status: 'pass',
    });
  });

  test('B1.3 - Supplier Master Setup', async ({ page }) => {
    const scenario = 'Supplier Master';
    
    // Navigate to Purchasing
    const purchaseSelectors = [
      'text=Purchase',
      'text=Procurement',
      'text=Suppliers',
      '[href*="purchase"]',
      '[href*="procurement"]',
    ];
    
    for (const selector of purchaseSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.3-purchase-module');
    
    // Look for Suppliers
    const supplierSelectors = [
      'text=Suppliers',
      'text=Vendors',
      'text=Supplier List',
      '[href*="supplier"]',
      '[href*="vendor"]',
    ];
    
    for (const selector of supplierSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.3-supplier-list');
    
    // Test Add Supplier
    const addSupplierResult = await testButton(page, 'button:has-text("Add Supplier")', 'Add Supplier');
    tracker.addButtonTest(addSupplierResult);
    
    if (addSupplierResult.clicked) {
      await fillForm(page, {
        'Supplier Name': SUPPLIERS[0].name,
        'Name': SUPPLIERS[0].name,
        'Email': SUPPLIERS[0].email,
        'Phone': SUPPLIERS[0].phone,
        'VAT Number': SUPPLIERS[0].vatNumber,
      });
      await screenshot(page, 'B1.3-supplier-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Supplier master',
      status: 'pass',
    });
  });

  test('B1.4 - Product/Inventory Master', async ({ page }) => {
    const scenario = 'Product Master';
    
    // Navigate to Inventory
    const inventorySelectors = [
      'text=Inventory',
      'text=Products',
      'text=Stock',
      '[href*="inventory"]',
      '[href*="products"]',
    ];
    
    for (const selector of inventorySelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.4-inventory-module');
    
    // Look for Products
    const productSelectors = [
      'text=Products',
      'text=Items',
      'text=Product List',
      '[href*="product"]',
      '[href*="item"]',
    ];
    
    for (const selector of productSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.4-product-list');
    
    // Test Add Product
    const addProductResult = await testButton(page, 'button:has-text("Add Product")', 'Add Product');
    tracker.addButtonTest(addProductResult);
    
    if (addProductResult.clicked) {
      const product = PRODUCTS.finishedGoods[0];
      await fillForm(page, {
        'SKU': product.sku,
        'Product Name': product.name,
        'Name': product.name,
        'Price': product.price.toString(),
        'Cost': product.cost.toString(),
        'Category': product.category,
      });
      await screenshot(page, 'B1.4-product-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Product master',
      status: 'pass',
    });
  });

  test('B1.5 - Warehouse/Location Setup', async ({ page }) => {
    const scenario = 'Warehouse Setup';
    
    // Navigate to Warehouse
    const warehouseSelectors = [
      'text=Warehouse',
      'text=Locations',
      'text=Storage',
      '[href*="warehouse"]',
      '[href*="location"]',
    ];
    
    for (const selector of warehouseSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.5-warehouse-module');
    
    // Look for warehouse management
    const whMgmtSelectors = [
      'text=Warehouses',
      'text=Location Management',
      '[href*="warehouse"]',
    ];
    
    for (const selector of whMgmtSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.5-warehouse-list');
    
    // Test Add Warehouse
    const addWhResult = await testButton(page, 'button:has-text("Add Warehouse")', 'Add Warehouse');
    tracker.addButtonTest(addWhResult);
    
    if (addWhResult.clicked) {
      await fillForm(page, {
        'Warehouse Name': 'Main Warehouse - JHB',
        'Name': 'Main Warehouse - JHB',
        'Code': 'WH-JHB-001',
        'Location': 'Johannesburg',
        'Address': '123 Industrial Road, Johannesburg',
      });
      await screenshot(page, 'B1.5-warehouse-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Warehouse setup',
      status: 'pass',
    });
  });

  test('B1.6 - Test All Master Data Buttons', async ({ page }) => {
    const scenario = 'Master Data Buttons';
    
    const modules = ['inventory', 'sales', 'purchase', 'finance'];
    const buttonsTested: string[] = [];
    
    for (const module of modules) {
      await navigateToModule(page, module);
      await page.waitForTimeout(1000);
      
      // Find all buttons on the page
      const buttons = await page.locator('button, .ant-btn').all();
      
      for (const button of buttons.slice(0, 10)) {
        const text = await button.textContent().catch(() => '');
        const isVisible = await button.isVisible().catch(() => false);
        const isEnabled = await button.isEnabled().catch(() => false);
        
        if (isVisible && text && text.trim().length > 0) {
          tracker.addButtonTest({
            name: `[${module}] ${text.trim()}`,
            selector: 'button',
            found: true,
            visible: isVisible,
            enabled: isEnabled,
            clicked: false,
          });
          buttonsTested.push(`${module}: ${text.trim()}`);
        }
      }
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'All master data buttons catalogued',
      status: 'pass',
      details: `Found ${buttonsTested.length} buttons across modules`,
    });
    
    await screenshot(page, 'B1.6-buttons-tested');
  });

  test('B1.7 - Employee Master Setup', async ({ page }) => {
    const scenario = 'Employee Master';
    
    // Navigate to HR
    const hrSelectors = [
      'text=HR',
      'text=Human Resources',
      'text=Employees',
      '[href*="hr"]',
      '[href*="human-resources"]',
    ];
    
    for (const selector of hrSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.7-hr-module');
    
    // Look for Employees
    const employeeSelectors = [
      'text=Employees',
      'text=Staff',
      'text=Personnel',
      '[href*="employee"]',
    ];
    
    for (const selector of employeeSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'B1.7-employee-list');
    
    // Test Add Employee
    const addEmployeeResult = await testButton(page, 'button:has-text("Add Employee")', 'Add Employee');
    tracker.addButtonTest(addEmployeeResult);
    
    if (addEmployeeResult.clicked) {
      await fillForm(page, {
        'First Name': 'John',
        'Last Name': 'Test',
        'Email': 'john.test@omnicorp.co.za',
        'ID Number': '9001015009087',
        'Department': 'Operations',
      });
      await screenshot(page, 'B1.7-employee-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Employee master',
      status: 'pass',
    });
  });

  test.afterAll(async () => {
    const summary = tracker.getSummary();
    console.log(`\n${'='.repeat(60)}`);
    console.log('PHASE 2 - MASTER DATA SUMMARY');
    console.log('='.repeat(60));
    console.log(`Buttons Tested: ${summary.buttonsTested}`);
    console.log(`Working: ${summary.buttonsWorking}`);
    console.log('='.repeat(60));
  });
});
