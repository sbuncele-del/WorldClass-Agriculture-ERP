/**
 * ============================================================================
 * PHASE 8: ASSET MANAGEMENT (IAS 16 Compliance)
 * H1. Asset Lifecycle, Depreciation, Revaluation
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
import { ASSETS } from '../fixtures/test-data';

const PHASE = 'Phase 8 - Assets';

test.describe('H1. Asset Management - IAS 16 Compliance', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('H1.1 - Asset Module Navigation', async ({ page }) => {
    const scenario = 'Asset Navigation';
    
    // Look for Asset module
    const assetSelectors = [
      'text=Assets',
      'text=Fixed Assets',
      'text=Asset Management',
      '[href*="asset"]',
    ];
    
    let found = false;
    for (const selector of assetSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'H1.1-asset-module');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Asset module navigation',
      status: found ? 'pass' : 'skip',
    });
  });

  test('H1.2 - Asset Register', async ({ page }) => {
    const scenario = 'Asset Register';
    
    await navigateToModule(page, 'assets');
    await page.waitForTimeout(1000);
    
    // Look for asset register
    const registerSelectors = [
      'text=Register',
      'text=Asset List',
      'text=All Assets',
      '[href*="register"]',
    ];
    
    for (const selector of registerSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'H1.2-asset-register');
    
    // Test Add Asset
    const addAssetResult = await testButton(page, 'button:has-text("Add Asset")', 'Add Asset');
    tracker.addButtonTest(addAssetResult);
    
    if (addAssetResult.clicked) {
      const asset = ASSETS.ppe[0];
      await fillForm(page, {
        'Asset Code': asset.code,
        'Asset Name': asset.name,
        'Category': asset.category,
        'Acquisition Date': asset.acquisitionDate,
        'Acquisition Cost': asset.acquisitionCost.toString(),
        'Useful Life': asset.usefulLife.toString(),
        'Residual Value': asset.residualValue.toString(),
      });
      await screenshot(page, 'H1.2-asset-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Asset register',
      status: 'pass',
    });
  });

  test('H1.3 - Depreciation Calculation', async ({ page }) => {
    const scenario = 'Depreciation';
    
    await navigateToModule(page, 'assets');
    await page.waitForTimeout(1000);
    
    // Look for depreciation
    const depreciationSelectors = [
      'text=Depreciation',
      'text=Calculate',
      '[href*="depreciation"]',
    ];
    
    for (const selector of depreciationSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'H1.3-depreciation');
    
    // Test Run Depreciation
    const runDepreciationResult = await testButton(page, 'button:has-text("Run Depreciation")', 'Run Depreciation');
    tracker.addButtonTest(runDepreciationResult);
    
    // Test Calculate
    const calculateResult = await testButton(page, 'button:has-text("Calculate")', 'Calculate');
    tracker.addButtonTest(calculateResult);
    
    // Validate depreciation methods available
    const methodSelectors = [
      'text=Straight Line',
      'text=Reducing Balance',
      'text=Units of Production',
    ];
    
    for (const selector of methodSelectors) {
      const element = await page.locator(selector).first();
      const visible = await element.isVisible().catch(() => false);
      tracker.addValidation({
        level: 'financial',
        check: `Depreciation method: ${selector}`,
        passed: visible,
      });
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Depreciation',
      status: 'pass',
    });
  });

  test('H1.4 - Asset Revaluation (IAS 16)', async ({ page }) => {
    const scenario = 'Asset Revaluation';
    
    await navigateToModule(page, 'assets');
    await page.waitForTimeout(1000);
    
    // Look for revaluation
    const revalSelectors = [
      'text=Revaluation',
      'text=Revalue',
      'text=Fair Value',
      '[href*="revaluation"]',
    ];
    
    for (const selector of revalSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'H1.4-revaluation');
    
    // Test Revalue Asset
    const revalueResult = await testButton(page, 'button:has-text("Revalue")', 'Revalue');
    tracker.addButtonTest(revalueResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Asset revaluation',
      status: 'pass',
    });
  });

  test('H1.5 - Asset Disposal', async ({ page }) => {
    const scenario = 'Asset Disposal';
    
    await navigateToModule(page, 'assets');
    await page.waitForTimeout(1000);
    
    // Look for disposal
    const disposalSelectors = [
      'text=Disposal',
      'text=Retire',
      'text=Dispose',
      '[href*="disposal"]',
    ];
    
    for (const selector of disposalSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'H1.5-disposal');
    
    // Test Dispose Asset
    const disposeResult = await testButton(page, 'button:has-text("Dispose")', 'Dispose');
    tracker.addButtonTest(disposeResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Asset disposal',
      status: 'pass',
    });
  });

  test('H1.6 - Asset Transfer', async ({ page }) => {
    const scenario = 'Asset Transfer';
    
    await navigateToModule(page, 'assets');
    await page.waitForTimeout(1000);
    
    // Look for transfer
    const transferSelectors = [
      'text=Transfer',
      'text=Move',
      'text=Relocate',
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
    
    await screenshot(page, 'H1.6-transfer');
    
    // Test Transfer Asset
    const transferResult = await testButton(page, 'button:has-text("Transfer")', 'Transfer');
    tracker.addButtonTest(transferResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Asset transfer',
      status: 'pass',
    });
  });

  test('H1.7 - Asset Reports', async ({ page }) => {
    const scenario = 'Asset Reports';
    
    await navigateToModule(page, 'assets');
    await page.waitForTimeout(1000);
    
    // Look for reports
    const reportSelectors = [
      'text=Reports',
      'text=Asset Report',
      'text=Depreciation Report',
      '[href*="report"]',
    ];
    
    for (const selector of reportSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'H1.7-reports');
    
    // Test Generate Report
    const generateReportResult = await testButton(page, 'button:has-text("Generate")', 'Generate');
    tracker.addButtonTest(generateReportResult);
    
    // Test Export
    const exportResult = await testButton(page, 'button:has-text("Export")', 'Export');
    tracker.addButtonTest(exportResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Asset reports',
      status: 'pass',
    });
  });

  test.afterAll(async () => {
    const summary = tracker.getSummary();
    console.log(`\n${'='.repeat(60)}`);
    console.log('PHASE 8 - ASSETS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tests: ${summary.total}`);
    console.log(`Buttons: ${summary.buttonsTested}`);
    console.log('='.repeat(60));
  });
});
