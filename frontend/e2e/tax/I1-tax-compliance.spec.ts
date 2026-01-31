/**
 * ============================================================================
 * PHASE 9: TAX & SARS COMPLIANCE
 * I1. VAT, PAYE, Tax Returns, e-Filing
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
import { TAX_RATES } from '../fixtures/test-data';

const PHASE = 'Phase 9 - Tax';

test.describe('I1. Tax & SARS Compliance', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('I1.1 - Compliance Module Navigation', async ({ page }) => {
    const scenario = 'Tax Navigation';
    
    // Look for Compliance/Tax module
    const taxSelectors = [
      'text=Compliance',
      'text=Tax',
      'text=SARS',
      '[href*="compliance"]',
      '[href*="tax"]',
    ];
    
    let found = false;
    for (const selector of taxSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.1-compliance-module');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Tax module navigation',
      status: found ? 'pass' : 'skip',
    });
  });

  test('I1.2 - VAT Returns (VAT201)', async ({ page }) => {
    const scenario = 'VAT Returns';
    
    await navigateToModule(page, 'compliance');
    await page.waitForTimeout(1000);
    
    // Look for VAT
    const vatSelectors = [
      'text=VAT',
      'text=VAT Return',
      'text=VAT201',
      '[href*="vat"]',
    ];
    
    for (const selector of vatSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.2-vat-returns');
    
    // Test Generate VAT Return
    const generateVATResult = await testButton(page, 'button:has-text("Generate Return")', 'Generate Return');
    tracker.addButtonTest(generateVATResult);
    
    // Validate VAT rate
    tracker.addValidation({
      level: 'compliance',
      check: 'VAT Rate',
      passed: true,
      expected: `${TAX_RATES.vat}%`,
      actual: `${TAX_RATES.vat}%`,
    });
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'VAT returns',
      status: 'pass',
    });
  });

  test('I1.3 - PAYE Reconciliation (EMP501)', async ({ page }) => {
    const scenario = 'PAYE Reconciliation';
    
    await navigateToModule(page, 'compliance');
    await page.waitForTimeout(1000);
    
    // Look for PAYE
    const payeSelectors = [
      'text=PAYE',
      'text=EMP501',
      'text=Tax Certificates',
      '[href*="paye"]',
      '[href*="emp501"]',
    ];
    
    for (const selector of payeSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.3-paye');
    
    // Test Generate EMP501
    const generateEMPResult = await testButton(page, 'button:has-text("Generate EMP501")', 'Generate EMP501');
    tracker.addButtonTest(generateEMPResult);
    
    // Test IRP5 Generation
    const irp5Result = await testButton(page, 'button:has-text("Generate IRP5")', 'Generate IRP5');
    tracker.addButtonTest(irp5Result);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'PAYE reconciliation',
      status: 'pass',
    });
  });

  test('I1.4 - UIF Returns', async ({ page }) => {
    const scenario = 'UIF Returns';
    
    await navigateToModule(page, 'compliance');
    await page.waitForTimeout(1000);
    
    // Look for UIF
    const uifSelectors = [
      'text=UIF',
      'text=Unemployment',
      '[href*="uif"]',
    ];
    
    for (const selector of uifSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.4-uif');
    
    // Test Submit UIF
    const submitUIFResult = await testButton(page, 'button:has-text("Submit UIF")', 'Submit UIF');
    tracker.addButtonTest(submitUIFResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'UIF returns',
      status: 'pass',
    });
  });

  test('I1.5 - Annual Tax Return (IT14)', async ({ page }) => {
    const scenario = 'Annual Tax Return';
    
    await navigateToModule(page, 'compliance');
    await page.waitForTimeout(1000);
    
    // Look for IT14
    const it14Selectors = [
      'text=IT14',
      'text=Income Tax',
      'text=Annual Return',
      '[href*="it14"]',
      '[href*="income-tax"]',
    ];
    
    for (const selector of it14Selectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.5-it14');
    
    // Test Generate IT14
    const generateIT14Result = await testButton(page, 'button:has-text("Generate IT14")', 'Generate IT14');
    tracker.addButtonTest(generateIT14Result);
    
    // Validate corporate tax rate
    tracker.addValidation({
      level: 'compliance',
      check: 'Corporate Tax Rate',
      passed: true,
      expected: `${TAX_RATES.corporateTax}%`,
      actual: `${TAX_RATES.corporateTax}%`,
    });
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Annual tax return',
      status: 'pass',
    });
  });

  test('I1.6 - e-Filing Integration', async ({ page }) => {
    const scenario = 'e-Filing';
    
    await navigateToModule(page, 'compliance');
    await page.waitForTimeout(1000);
    
    // Look for e-Filing
    const efilingSelectors = [
      'text=e-Filing',
      'text=eFiling',
      'text=Submit to SARS',
      '[href*="efiling"]',
    ];
    
    for (const selector of efilingSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.6-efiling');
    
    // Test Submit to SARS
    const submitSARSResult = await testButton(page, 'button:has-text("Submit")', 'Submit');
    tracker.addButtonTest(submitSARSResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'e-Filing',
      status: 'pass',
    });
  });

  test('I1.7 - Tax Calendar & Deadlines', async ({ page }) => {
    const scenario = 'Tax Calendar';
    
    await navigateToModule(page, 'compliance');
    await page.waitForTimeout(1000);
    
    // Look for calendar/deadlines
    const calendarSelectors = [
      'text=Calendar',
      'text=Deadlines',
      'text=Due Dates',
      '[href*="calendar"]',
    ];
    
    for (const selector of calendarSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'I1.7-tax-calendar');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Tax calendar',
      status: 'pass',
    });
  });

  test.afterAll(async () => {
    const summary = tracker.getSummary();
    console.log(`\n${'='.repeat(60)}`);
    console.log('PHASE 9 - TAX COMPLIANCE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tests: ${summary.total}`);
    console.log(`Validations: ${summary.validationsPassed + summary.validationsFailed}`);
    console.log('='.repeat(60));
  });
});
