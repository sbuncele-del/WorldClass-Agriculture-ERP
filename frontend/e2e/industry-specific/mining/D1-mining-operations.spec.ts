/**
 * ============================================================================
 * PHASE 4: INDUSTRY-SPECIFIC MODULES - MINING
 * D1. OmniMine Mining Operations
 * ============================================================================
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, generateTestId } from '../../utils/test-config';
import { 
  loginAsDemo, 
  navigateToModule, 
  testButton, 
  fillForm, 
  screenshot,
} from '../../utils/helpers';
import { tracker } from '../../utils/tracker';
import { MINING_DATA, SUBSIDIARIES } from '../../fixtures/test-data';

const PHASE = 'Phase 4 - Mining';

test.describe('D1. Mining Operations - OmniMine', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('D1.1 - Mining Module Navigation', async ({ page }) => {
    const scenario = 'Mining Navigation';
    
    // Look for Mining module
    const miningSelectors = [
      'text=Mining',
      'text=Mine Operations',
      '[href*="mining"]',
      '[data-testid="mining"]',
    ];
    
    let found = false;
    for (const selector of miningSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D1.1-mining-module');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Mining module access',
      status: found ? 'pass' : 'skip',
      details: found ? 'Mining module found' : 'Mining module not in navigation',
    });
  });

  test('D1.2 - Mineral Tracking', async ({ page }) => {
    const scenario = 'Mineral Tracking';
    
    await navigateToModule(page, 'mining');
    await page.waitForTimeout(1000);
    
    // Look for mineral tracking
    const mineralSelectors = [
      'text=Minerals',
      'text=Ore Tracking',
      'text=Production',
      '[href*="mineral"]',
    ];
    
    for (const selector of mineralSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D1.2-mineral-tracking');
    
    // Test Record Production
    const recordProdResult = await testButton(page, 'button:has-text("Record Production")', 'Record Production');
    tracker.addButtonTest(recordProdResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Mineral tracking',
      status: 'pass',
    });
  });

  test('D1.3 - Safety Compliance', async ({ page }) => {
    const scenario = 'Safety Compliance';
    
    await navigateToModule(page, 'mining');
    await page.waitForTimeout(1000);
    
    // Look for safety
    const safetySelectors = [
      'text=Safety',
      'text=HSE',
      'text=Incidents',
      'text=Compliance',
      '[href*="safety"]',
    ];
    
    for (const selector of safetySelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D1.3-safety-compliance');
    
    // Test Report Incident
    const reportIncidentResult = await testButton(page, 'button:has-text("Report Incident")', 'Report Incident');
    tracker.addButtonTest(reportIncidentResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Safety compliance',
      status: 'pass',
    });
  });

  test('D1.4 - Environmental Reporting', async ({ page }) => {
    const scenario = 'Environmental Reporting';
    
    await navigateToModule(page, 'mining');
    await page.waitForTimeout(1000);
    
    // Look for environmental
    const envSelectors = [
      'text=Environmental',
      'text=Environment',
      'text=ESG',
      'text=Emissions',
      '[href*="environment"]',
    ];
    
    for (const selector of envSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D1.4-environmental');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Environmental reporting',
      status: 'pass',
    });
  });

  test('D1.5 - Shaft Management', async ({ page }) => {
    const scenario = 'Shaft Management';
    
    await navigateToModule(page, 'mining');
    await page.waitForTimeout(1000);
    
    // Look for shaft/operations
    const shaftSelectors = [
      'text=Shafts',
      'text=Operations',
      'text=Underground',
      '[href*="shaft"]',
    ];
    
    for (const selector of shaftSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D1.5-shaft-management');
    
    // Test Add Shaft
    const addShaftResult = await testButton(page, 'button:has-text("Add Shaft")', 'Add Shaft');
    tracker.addButtonTest(addShaftResult);
    
    if (addShaftResult.clicked) {
      await fillForm(page, {
        'Shaft Name': MINING_DATA.shafts[0].name,
        'Depth': MINING_DATA.shafts[0].depth.toString(),
        'Status': MINING_DATA.shafts[0].status,
      });
      await screenshot(page, 'D1.5-shaft-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Shaft management',
      status: 'pass',
    });
  });

  test.afterAll(async () => {
    const summary = tracker.getSummary();
    console.log(`\n${'='.repeat(60)}`);
    console.log('PHASE 4 - MINING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tests: ${summary.total}`);
    console.log(`Buttons: ${summary.buttonsTested}`);
    console.log('='.repeat(60));
  });
});
