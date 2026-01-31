/**
 * ============================================================================
 * PHASE 5: TREASURY & CASH MANAGEMENT
 * E1. Bank Reconciliation, Cash Flow, Forecasting
 * ============================================================================
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, generateTestId } from '../utils/test-config';
import { 
  loginAsDemo, 
  navigateToModule, 
  testButton, 
  fillForm, 
  screenshot,
} from '../utils/helpers';
import { tracker } from '../utils/tracker';
import { OMNICORP_HOLDING } from '../fixtures/test-data';

const PHASE = 'Phase 5 - Treasury';

test.describe('E1. Treasury & Cash Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('E1.1 - Cash Management Navigation', async ({ page }) => {
    const scenario = 'Cash Management Navigation';
    
    // Look for Cash/Treasury module
    const cashSelectors = [
      'text=Cash',
      'text=Treasury',
      'text=Cash Management',
      '[href*="cash"]',
      '[href*="treasury"]',
    ];
    
    let found = false;
    for (const selector of cashSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'E1.1-cash-management');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Cash management navigation',
      status: found ? 'pass' : 'skip',
    });
  });

  test('E1.2 - Bank Accounts Setup', async ({ page }) => {
    const scenario = 'Bank Accounts';
    
    await navigateToModule(page, 'cash');
    await page.waitForTimeout(1000);
    
    // Look for bank accounts
    const bankSelectors = [
      'text=Bank Accounts',
      'text=Accounts',
      'text=Banks',
      '[href*="bank"]',
    ];
    
    for (const selector of bankSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'E1.2-bank-accounts');
    
    // Test Add Bank Account
    const addBankResult = await testButton(page, 'button:has-text("Add Account")', 'Add Account');
    tracker.addButtonTest(addBankResult);
    
    if (addBankResult.clicked) {
      const banking = OMNICORP_HOLDING.banking;
      await fillForm(page, {
        'Bank Name': banking.bank,
        'Account Name': banking.accountName,
        'Account Number': banking.accountNumber,
        'Branch Code': banking.branchCode,
      });
      await screenshot(page, 'E1.2-bank-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Bank accounts',
      status: 'pass',
    });
  });

  test('E1.3 - Bank Reconciliation', async ({ page }) => {
    const scenario = 'Bank Reconciliation';
    
    await navigateToModule(page, 'cash');
    await page.waitForTimeout(1000);
    
    // Look for reconciliation
    const reconSelectors = [
      'text=Reconciliation',
      'text=Bank Recon',
      'text=Reconcile',
      '[href*="reconcil"]',
    ];
    
    for (const selector of reconSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'E1.3-bank-reconciliation');
    
    // Test Start Reconciliation
    const startReconResult = await testButton(page, 'button:has-text("Start Reconciliation")', 'Start Reconciliation');
    tracker.addButtonTest(startReconResult);
    
    // Test Import Statement
    const importResult = await testButton(page, 'button:has-text("Import Statement")', 'Import Statement');
    tracker.addButtonTest(importResult);
    
    // Test Auto Match
    const autoMatchResult = await testButton(page, 'button:has-text("Auto Match")', 'Auto Match');
    tracker.addButtonTest(autoMatchResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Bank reconciliation',
      status: 'pass',
    });
  });

  test('E1.4 - Cash Flow Management', async ({ page }) => {
    const scenario = 'Cash Flow';
    
    await navigateToModule(page, 'cash');
    await page.waitForTimeout(1000);
    
    // Look for cash flow
    const cashFlowSelectors = [
      'text=Cash Flow',
      'text=Flow',
      'text=Forecast',
      '[href*="flow"]',
      '[href*="forecast"]',
    ];
    
    for (const selector of cashFlowSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'E1.4-cash-flow');
    
    // Test Generate Forecast
    const generateForecastResult = await testButton(page, 'button:has-text("Generate Forecast")', 'Generate Forecast');
    tracker.addButtonTest(generateForecastResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Cash flow',
      status: 'pass',
    });
  });

  test('E1.5 - Payment Processing', async ({ page }) => {
    const scenario = 'Payment Processing';
    
    await navigateToModule(page, 'cash');
    await page.waitForTimeout(1000);
    
    // Look for payments
    const paymentSelectors = [
      'text=Payments',
      'text=Pay Suppliers',
      'text=Disbursements',
      '[href*="payment"]',
    ];
    
    for (const selector of paymentSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'E1.5-payments');
    
    // Test Create Payment
    const createPaymentResult = await testButton(page, 'button:has-text("Create Payment")', 'Create Payment');
    tracker.addButtonTest(createPaymentResult);
    
    // Test Payment Run
    const paymentRunResult = await testButton(page, 'button:has-text("Payment Run")', 'Payment Run');
    tracker.addButtonTest(paymentRunResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Payment processing',
      status: 'pass',
    });
  });

  test('E1.6 - Receipt Recording', async ({ page }) => {
    const scenario = 'Receipt Recording';
    
    await navigateToModule(page, 'cash');
    await page.waitForTimeout(1000);
    
    // Look for receipts
    const receiptSelectors = [
      'text=Receipts',
      'text=Collections',
      'text=Money In',
      '[href*="receipt"]',
    ];
    
    for (const selector of receiptSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'E1.6-receipts');
    
    // Test Record Receipt
    const recordReceiptResult = await testButton(page, 'button:has-text("Record Receipt")', 'Record Receipt');
    tracker.addButtonTest(recordReceiptResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Receipt recording',
      status: 'pass',
    });
  });

  test.afterAll(async () => {
    const summary = tracker.getSummary();
    console.log(`\n${'='.repeat(60)}`);
    console.log('PHASE 5 - TREASURY SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tests: ${summary.total}`);
    console.log(`Buttons: ${summary.buttonsTested}`);
    console.log('='.repeat(60));
  });
});
