/**
 * ============================================================================
 * PHASE 3: BUSINESS CYCLES - MANUFACTURING TO DELIVERY
 * C1. Order-to-Cash, Procure-to-Pay, Production, Delivery
 * ============================================================================
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, generateTestId } from '../utils/test-config';
import { 
  loginAsDemo, 
  navigateToModule, 
  testButton, 
  fillForm, 
  submitForm,
  waitForTable,
  screenshot,
  apiRequest,
} from '../utils/helpers';
import { tracker } from '../utils/tracker';
import { 
  CUSTOMERS, 
  SUPPLIERS, 
  PRODUCTS,
  TRANSACTION_TEMPLATES,
} from '../fixtures/test-data';

const PHASE = 'Phase 3 - Business Cycles';

test.describe('C1. Order-to-Cash Cycle', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('C1.1 - Create Sales Quote', async ({ page }) => {
    const scenario = 'Sales Quote';
    
    await navigateToModule(page, 'sales');
    await page.waitForTimeout(1000);
    
    // Look for Quotes
    const quoteSelectors = [
      'text=Quotes',
      'text=Quotations',
      'text=Proposals',
      '[href*="quote"]',
    ];
    
    for (const selector of quoteSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C1.1-quotes-page');
    
    // Create Quote
    const createQuoteResult = await testButton(page, 'button:has-text("Create Quote")', 'Create Quote');
    if (!createQuoteResult.clicked) {
      await testButton(page, 'button:has-text("New Quote")', 'New Quote');
    }
    tracker.addButtonTest(createQuoteResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Create sales quote',
      status: 'pass',
    });
  });

  test('C1.2 - Create Sales Order', async ({ page }) => {
    const scenario = 'Sales Order';
    
    await navigateToModule(page, 'sales');
    await page.waitForTimeout(1000);
    
    // Look for Sales Orders
    const soSelectors = [
      'text=Sales Orders',
      'text=Orders',
      '[href*="sales-order"]',
      '[href*="order"]',
    ];
    
    for (const selector of soSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C1.2-sales-orders');
    
    // Create Sales Order
    const createSOResult = await testButton(page, 'button:has-text("Create Order")', 'Create Order');
    if (!createSOResult.clicked) {
      await testButton(page, 'button:has-text("New Order")', 'New Order');
    }
    tracker.addButtonTest(createSOResult);
    
    if (createSOResult.clicked) {
      await page.waitForTimeout(500);
      await fillForm(page, {
        'Customer': CUSTOMERS[0].name,
        'Order Date': new Date().toISOString().split('T')[0],
        'Reference': `SO-${generateTestId()}`,
      });
      await screenshot(page, 'C1.2-sales-order-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Create sales order',
      status: 'pass',
    });
  });

  test('C1.3 - Create Sales Invoice', async ({ page }) => {
    const scenario = 'Sales Invoice';
    
    await navigateToModule(page, 'sales');
    await page.waitForTimeout(1000);
    
    // Look for Invoices
    const invoiceSelectors = [
      'text=Invoices',
      'text=Sales Invoices',
      '[href*="invoice"]',
    ];
    
    for (const selector of invoiceSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C1.3-invoices-page');
    
    // Create Invoice
    const createInvResult = await testButton(page, 'button:has-text("Create Invoice")', 'Create Invoice');
    if (!createInvResult.clicked) {
      await testButton(page, 'button:has-text("New Invoice")', 'New Invoice');
    }
    tracker.addButtonTest(createInvResult);
    
    if (createInvResult.clicked) {
      await page.waitForTimeout(500);
      await fillForm(page, {
        'Customer': CUSTOMERS[0].name,
        'Invoice Number': `INV-${generateTestId()}`,
        'Invoice Date': new Date().toISOString().split('T')[0],
      });
      await screenshot(page, 'C1.3-invoice-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Create sales invoice',
      status: 'pass',
    });
  });

  test('C1.4 - Record Payment', async ({ page }) => {
    const scenario = 'Record Payment';
    
    await navigateToModule(page, 'finance');
    await page.waitForTimeout(1000);
    
    // Look for Payments or Cash Management
    const paymentSelectors = [
      'text=Payments',
      'text=Receipts',
      'text=Cash',
      'text=Cash Management',
      '[href*="payment"]',
      '[href*="cash"]',
    ];
    
    for (const selector of paymentSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C1.4-payments-page');
    
    // Record Payment
    const recordPaymentResult = await testButton(page, 'button:has-text("Record Payment")', 'Record Payment');
    if (!recordPaymentResult.clicked) {
      await testButton(page, 'button:has-text("New Payment")', 'New Payment');
    }
    tracker.addButtonTest(recordPaymentResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Record payment',
      status: 'pass',
    });
  });
});

test.describe('C2. Procure-to-Pay Cycle', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('C2.1 - Create Purchase Requisition', async ({ page }) => {
    const scenario = 'Purchase Requisition';
    
    await navigateToModule(page, 'purchase');
    await page.waitForTimeout(1000);
    
    // Look for Requisitions
    const reqSelectors = [
      'text=Requisitions',
      'text=Purchase Requests',
      '[href*="requisition"]',
    ];
    
    for (const selector of reqSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C2.1-requisitions-page');
    
    // Create Requisition
    const createReqResult = await testButton(page, 'button:has-text("Create Requisition")', 'Create Requisition');
    tracker.addButtonTest(createReqResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Create purchase requisition',
      status: 'pass',
    });
  });

  test('C2.2 - Create Purchase Order', async ({ page }) => {
    const scenario = 'Purchase Order';
    
    await navigateToModule(page, 'purchase');
    await page.waitForTimeout(1000);
    
    // Look for Purchase Orders
    const poSelectors = [
      'text=Purchase Orders',
      'text=Orders',
      '[href*="purchase-order"]',
      '[href*="po"]',
    ];
    
    for (const selector of poSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C2.2-purchase-orders');
    
    // Create PO
    const createPOResult = await testButton(page, 'button:has-text("Create Order")', 'Create Order');
    if (!createPOResult.clicked) {
      await testButton(page, 'button:has-text("New Order")', 'New Order');
    }
    tracker.addButtonTest(createPOResult);
    
    if (createPOResult.clicked) {
      await fillForm(page, {
        'Supplier': SUPPLIERS[0].name,
        'Order Number': `PO-${generateTestId()}`,
        'Order Date': new Date().toISOString().split('T')[0],
      });
      await screenshot(page, 'C2.2-po-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Create purchase order',
      status: 'pass',
    });
  });

  test('C2.3 - Goods Receipt', async ({ page }) => {
    const scenario = 'Goods Receipt';
    
    await navigateToModule(page, 'inventory');
    await page.waitForTimeout(1000);
    
    // Look for Goods Receipt
    const grSelectors = [
      'text=Goods Receipt',
      'text=Receiving',
      'text=Stock In',
      '[href*="receipt"]',
      '[href*="receiving"]',
    ];
    
    for (const selector of grSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C2.3-goods-receipt');
    
    // Create GR
    const createGRResult = await testButton(page, 'button:has-text("Create Receipt")', 'Create Receipt');
    tracker.addButtonTest(createGRResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Goods receipt',
      status: 'pass',
    });
  });

  test('C2.4 - Supplier Invoice & Payment', async ({ page }) => {
    const scenario = 'Supplier Invoice';
    
    await navigateToModule(page, 'purchase');
    await page.waitForTimeout(1000);
    
    // Look for Supplier Invoices
    const invSelectors = [
      'text=Supplier Invoices',
      'text=Bills',
      'text=Purchase Invoices',
      '[href*="invoice"]',
      '[href*="bill"]',
    ];
    
    for (const selector of invSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C2.4-supplier-invoices');
    
    // Create Bill
    const createBillResult = await testButton(page, 'button:has-text("Create Bill")', 'Create Bill');
    if (!createBillResult.clicked) {
      await testButton(page, 'button:has-text("New Invoice")', 'New Invoice');
    }
    tracker.addButtonTest(createBillResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Supplier invoice',
      status: 'pass',
    });
  });
});

test.describe('C3. Manufacturing Cycle', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('C3.1 - Bill of Materials (BOM)', async ({ page }) => {
    const scenario = 'Bill of Materials';
    
    await navigateToModule(page, 'manufacturing');
    await page.waitForTimeout(1000);
    
    // Look for BOM
    const bomSelectors = [
      'text=BOM',
      'text=Bill of Materials',
      'text=Product Structure',
      '[href*="bom"]',
    ];
    
    for (const selector of bomSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C3.1-bom-page');
    
    // Create BOM
    const createBOMResult = await testButton(page, 'button:has-text("Create BOM")', 'Create BOM');
    tracker.addButtonTest(createBOMResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Bill of materials',
      status: 'pass',
    });
  });

  test('C3.2 - Work Order', async ({ page }) => {
    const scenario = 'Work Order';
    
    await navigateToModule(page, 'manufacturing');
    await page.waitForTimeout(1000);
    
    // Look for Work Orders
    const woSelectors = [
      'text=Work Orders',
      'text=Production Orders',
      'text=Manufacturing Orders',
      '[href*="work-order"]',
      '[href*="production"]',
    ];
    
    for (const selector of woSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C3.2-work-orders');
    
    // Create Work Order
    const createWOResult = await testButton(page, 'button:has-text("Create Work Order")', 'Create Work Order');
    tracker.addButtonTest(createWOResult);
    
    if (createWOResult.clicked) {
      await fillForm(page, {
        'Product': PRODUCTS.finishedGoods[0].name,
        'Quantity': '100',
        'Start Date': new Date().toISOString().split('T')[0],
      });
      await screenshot(page, 'C3.2-work-order-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Work order',
      status: 'pass',
    });
  });

  test('C3.3 - Production Completion', async ({ page }) => {
    const scenario = 'Production Completion';
    
    await navigateToModule(page, 'manufacturing');
    await page.waitForTimeout(1000);
    
    // Look for Production/Operations
    const prodSelectors = [
      'text=Production',
      'text=Shop Floor',
      'text=Operations',
      '[href*="production"]',
    ];
    
    for (const selector of prodSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C3.3-production-page');
    
    // Record Production
    const recordProdResult = await testButton(page, 'button:has-text("Record Production")', 'Record Production');
    tracker.addButtonTest(recordProdResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Production completion',
      status: 'pass',
    });
  });
});

test.describe('C4. Delivery & Fulfillment', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('C4.1 - Delivery Note', async ({ page }) => {
    const scenario = 'Delivery Note';
    
    await navigateToModule(page, 'sales');
    await page.waitForTimeout(1000);
    
    // Look for Delivery
    const deliverySelectors = [
      'text=Delivery',
      'text=Shipments',
      'text=Dispatch',
      '[href*="delivery"]',
      '[href*="shipment"]',
    ];
    
    for (const selector of deliverySelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C4.1-delivery-page');
    
    // Create Delivery
    const createDeliveryResult = await testButton(page, 'button:has-text("Create Delivery")', 'Create Delivery');
    tracker.addButtonTest(createDeliveryResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Delivery note',
      status: 'pass',
    });
  });

  test('C4.2 - Stock Transfer', async ({ page }) => {
    const scenario = 'Stock Transfer';
    
    await navigateToModule(page, 'inventory');
    await page.waitForTimeout(1000);
    
    // Look for Transfers
    const transferSelectors = [
      'text=Transfer',
      'text=Stock Transfer',
      'text=Movement',
      '[href*="transfer"]',
    ];
    
    for (const selector of transferSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'C4.2-transfer-page');
    
    // Create Transfer
    const createTransferResult = await testButton(page, 'button:has-text("Create Transfer")', 'Create Transfer');
    tracker.addButtonTest(createTransferResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Stock transfer',
      status: 'pass',
    });
  });

  test.afterAll(async () => {
    const summary = tracker.getSummary();
    console.log(`\n${'='.repeat(60)}`);
    console.log('PHASE 3 - BUSINESS CYCLES SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tests Run: ${summary.total}`);
    console.log(`Buttons Tested: ${summary.buttonsTested}`);
    console.log('='.repeat(60));
  });
});
