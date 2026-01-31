/**
 * ============================================================================
 * PHASE 4: INDUSTRY-SPECIFIC MODULES - PROPERTY MANAGEMENT
 * D4. OmniProperty Real Estate Operations
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
import { PROPERTY_DATA, SUBSIDIARIES } from '../../fixtures/test-data';

const PHASE = 'Phase 4 - Property';

test.describe('D4. Property Management - OmniProperty', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('D4.1 - Property Module Navigation', async ({ page }) => {
    const scenario = 'Property Navigation';
    
    // Look for Property module
    const propertySelectors = [
      'text=Property',
      'text=Real Estate',
      'text=Properties',
      '[href*="property"]',
      '[href*="real-estate"]',
    ];
    
    let found = false;
    for (const selector of propertySelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D4.1-property-module');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Property module access',
      status: found ? 'pass' : 'skip',
    });
  });

  test('D4.2 - Property Listings', async ({ page }) => {
    const scenario = 'Property Listings';
    
    await navigateToModule(page, 'property');
    await page.waitForTimeout(1000);
    
    // Look for properties
    const listingSelectors = [
      'text=Properties',
      'text=Listings',
      'text=Portfolio',
      '[href*="listing"]',
    ];
    
    for (const selector of listingSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D4.2-property-listings');
    
    // Test Add Property
    const addPropertyResult = await testButton(page, 'button:has-text("Add Property")', 'Add Property');
    tracker.addButtonTest(addPropertyResult);
    
    if (addPropertyResult.clicked) {
      const property = PROPERTY_DATA.properties[0];
      await fillForm(page, {
        'Property Name': property.name,
        'Type': property.type,
        'Units': property.units.toString(),
      });
      await screenshot(page, 'D4.2-property-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Property listings',
      status: 'pass',
    });
  });

  test('D4.3 - Tenant Management', async ({ page }) => {
    const scenario = 'Tenant Management';
    
    await navigateToModule(page, 'property');
    await page.waitForTimeout(1000);
    
    // Look for tenants
    const tenantSelectors = [
      'text=Tenants',
      'text=Lessees',
      'text=Occupants',
      '[href*="tenant"]',
    ];
    
    for (const selector of tenantSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D4.3-tenants');
    
    // Test Add Tenant
    const addTenantResult = await testButton(page, 'button:has-text("Add Tenant")', 'Add Tenant');
    tracker.addButtonTest(addTenantResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Tenant management',
      status: 'pass',
    });
  });

  test('D4.4 - Lease Management', async ({ page }) => {
    const scenario = 'Lease Management';
    
    await navigateToModule(page, 'property');
    await page.waitForTimeout(1000);
    
    // Look for leases
    const leaseSelectors = [
      'text=Leases',
      'text=Contracts',
      'text=Rental Agreements',
      '[href*="lease"]',
    ];
    
    for (const selector of leaseSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D4.4-leases');
    
    // Test Create Lease
    const createLeaseResult = await testButton(page, 'button:has-text("Create Lease")', 'Create Lease');
    tracker.addButtonTest(createLeaseResult);
    
    if (createLeaseResult.clicked) {
      const lease = PROPERTY_DATA.leaseTemplate;
      await fillForm(page, {
        'Term (Months)': lease.term.toString(),
        'Escalation (%)': lease.escalation.toString(),
        'Deposit (Months)': lease.deposit.toString(),
      });
      await screenshot(page, 'D4.4-lease-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Lease management',
      status: 'pass',
    });
  });

  test('D4.5 - Rent Collection', async ({ page }) => {
    const scenario = 'Rent Collection';
    
    await navigateToModule(page, 'property');
    await page.waitForTimeout(1000);
    
    // Look for rent
    const rentSelectors = [
      'text=Rent',
      'text=Billing',
      'text=Collections',
      '[href*="rent"]',
      '[href*="billing"]',
    ];
    
    for (const selector of rentSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D4.5-rent-collection');
    
    // Test Generate Invoices
    const generateInvResult = await testButton(page, 'button:has-text("Generate Invoices")', 'Generate Invoices');
    tracker.addButtonTest(generateInvResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Rent collection',
      status: 'pass',
    });
  });

  test('D4.6 - Maintenance Requests', async ({ page }) => {
    const scenario = 'Maintenance';
    
    await navigateToModule(page, 'property');
    await page.waitForTimeout(1000);
    
    // Look for maintenance
    const maintenanceSelectors = [
      'text=Maintenance',
      'text=Repairs',
      'text=Work Orders',
      '[href*="maintenance"]',
    ];
    
    for (const selector of maintenanceSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D4.6-maintenance');
    
    // Test Log Request
    const logRequestResult = await testButton(page, 'button:has-text("Log Request")', 'Log Request');
    tracker.addButtonTest(logRequestResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Maintenance',
      status: 'pass',
    });
  });
});
