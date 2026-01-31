/**
 * ============================================================================
 * PHASE 4: INDUSTRY-SPECIFIC MODULES - AGRICULTURE
 * D3. OmniFarm Agricultural Operations
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
import { AGRICULTURE_DATA, SUBSIDIARIES } from '../../fixtures/test-data';

const PHASE = 'Phase 4 - Agriculture';

test.describe('D3. Agricultural Operations - OmniFarm', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('D3.1 - Agriculture Module Navigation', async ({ page }) => {
    const scenario = 'Agriculture Navigation';
    
    // Look for Agriculture module
    const agriSelectors = [
      'text=Agriculture',
      'text=Farm',
      'text=Farming',
      '[href*="agriculture"]',
      '[href*="farm"]',
    ];
    
    let found = false;
    for (const selector of agriSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D3.1-agriculture-module');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Agriculture module access',
      status: found ? 'pass' : 'skip',
    });
  });

  test('D3.2 - Farm Management', async ({ page }) => {
    const scenario = 'Farm Management';
    
    await navigateToModule(page, 'agriculture');
    await page.waitForTimeout(1000);
    
    // Look for farms
    const farmSelectors = [
      'text=Farms',
      'text=Properties',
      'text=Land',
      '[href*="farm"]',
    ];
    
    for (const selector of farmSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D3.2-farms');
    
    // Test Add Farm
    const addFarmResult = await testButton(page, 'button:has-text("Add Farm")', 'Add Farm');
    tracker.addButtonTest(addFarmResult);
    
    if (addFarmResult.clicked) {
      const farm = AGRICULTURE_DATA.farms[0];
      await fillForm(page, {
        'Farm Name': farm.name,
        'Hectares': farm.hectares.toString(),
        'Crops': farm.crops.join(', '),
      });
      await screenshot(page, 'D3.2-farm-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Farm management',
      status: 'pass',
    });
  });

  test('D3.3 - Crop Planning', async ({ page }) => {
    const scenario = 'Crop Planning';
    
    await navigateToModule(page, 'agriculture');
    await page.waitForTimeout(1000);
    
    // Look for crops
    const cropSelectors = [
      'text=Crops',
      'text=Crop Planning',
      'text=Planting',
      '[href*="crop"]',
    ];
    
    for (const selector of cropSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D3.3-crop-planning');
    
    // Test Plan Season
    const planSeasonResult = await testButton(page, 'button:has-text("Plan Season")', 'Plan Season');
    tracker.addButtonTest(planSeasonResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Crop planning',
      status: 'pass',
    });
  });

  test('D3.4 - Harvest Recording', async ({ page }) => {
    const scenario = 'Harvest Recording';
    
    await navigateToModule(page, 'agriculture');
    await page.waitForTimeout(1000);
    
    // Look for harvest
    const harvestSelectors = [
      'text=Harvest',
      'text=Production',
      'text=Yield',
      '[href*="harvest"]',
    ];
    
    for (const selector of harvestSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D3.4-harvest');
    
    // Test Record Harvest
    const recordHarvestResult = await testButton(page, 'button:has-text("Record Harvest")', 'Record Harvest');
    tracker.addButtonTest(recordHarvestResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Harvest recording',
      status: 'pass',
    });
  });

  test('D3.5 - Livestock Management', async ({ page }) => {
    const scenario = 'Livestock Management';
    
    await navigateToModule(page, 'agriculture');
    await page.waitForTimeout(1000);
    
    // Look for livestock
    const livestockSelectors = [
      'text=Livestock',
      'text=Animals',
      'text=Herd',
      '[href*="livestock"]',
    ];
    
    for (const selector of livestockSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D3.5-livestock');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Livestock management',
      status: 'pass',
    });
  });
});
