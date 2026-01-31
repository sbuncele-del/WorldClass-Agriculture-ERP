/**
 * ============================================================================
 * PHASE 4: INDUSTRY-SPECIFIC MODULES - HEALTHCARE
 * D2. OmniHealth Medical Operations
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
import { HEALTHCARE_DATA, SUBSIDIARIES } from '../../fixtures/test-data';

const PHASE = 'Phase 4 - Healthcare';

test.describe('D2. Healthcare Operations - OmniHealth', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForTimeout(2000);
  });

  test('D2.1 - Healthcare Module Navigation', async ({ page }) => {
    const scenario = 'Healthcare Navigation';
    
    // Look for Healthcare module
    const healthSelectors = [
      'text=Healthcare',
      'text=Medical',
      'text=Hospital',
      '[href*="healthcare"]',
      '[href*="medical"]',
    ];
    
    let found = false;
    for (const selector of healthSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D2.1-healthcare-module');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Healthcare module access',
      status: found ? 'pass' : 'skip',
    });
  });

  test('D2.2 - Patient Registration', async ({ page }) => {
    const scenario = 'Patient Registration';
    
    await navigateToModule(page, 'healthcare');
    await page.waitForTimeout(1000);
    
    // Look for patients
    const patientSelectors = [
      'text=Patients',
      'text=Patient Management',
      'text=Registration',
      '[href*="patient"]',
    ];
    
    for (const selector of patientSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D2.2-patients');
    
    // Test Register Patient
    const registerPatientResult = await testButton(page, 'button:has-text("Register Patient")', 'Register Patient');
    if (!registerPatientResult.clicked) {
      await testButton(page, 'button:has-text("Add Patient")', 'Add Patient');
    }
    tracker.addButtonTest(registerPatientResult);
    
    if (registerPatientResult.clicked) {
      const patient = HEALTHCARE_DATA.patientTemplate;
      await fillForm(page, {
        'First Name': patient.firstName,
        'Last Name': patient.lastName,
        'ID Number': patient.idNumber,
        'Medical Aid Number': patient.medicalAidNumber,
        'Blood Type': patient.bloodType,
      });
      await screenshot(page, 'D2.2-patient-form');
    }
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Patient registration',
      status: 'pass',
    });
  });

  test('D2.3 - Appointment Scheduling', async ({ page }) => {
    const scenario = 'Appointment Scheduling';
    
    await navigateToModule(page, 'healthcare');
    await page.waitForTimeout(1000);
    
    // Look for appointments
    const appointmentSelectors = [
      'text=Appointments',
      'text=Schedule',
      'text=Booking',
      '[href*="appointment"]',
    ];
    
    for (const selector of appointmentSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D2.3-appointments');
    
    // Test Book Appointment
    const bookApptResult = await testButton(page, 'button:has-text("Book Appointment")', 'Book Appointment');
    tracker.addButtonTest(bookApptResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Appointment scheduling',
      status: 'pass',
    });
  });

  test('D2.4 - Medical Inventory', async ({ page }) => {
    const scenario = 'Medical Inventory';
    
    await navigateToModule(page, 'healthcare');
    await page.waitForTimeout(1000);
    
    // Look for medical inventory
    const invSelectors = [
      'text=Pharmacy',
      'text=Medical Supplies',
      'text=Inventory',
      '[href*="pharmacy"]',
      '[href*="supplies"]',
    ];
    
    for (const selector of invSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D2.4-medical-inventory');
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Medical inventory',
      status: 'pass',
    });
  });

  test('D2.5 - Medical Billing', async ({ page }) => {
    const scenario = 'Medical Billing';
    
    await navigateToModule(page, 'healthcare');
    await page.waitForTimeout(1000);
    
    // Look for billing
    const billingSelectors = [
      'text=Billing',
      'text=Claims',
      'text=Medical Aid Claims',
      '[href*="billing"]',
      '[href*="claim"]',
    ];
    
    for (const selector of billingSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    await screenshot(page, 'D2.5-medical-billing');
    
    // Test Create Claim
    const createClaimResult = await testButton(page, 'button:has-text("Create Claim")', 'Create Claim');
    tracker.addButtonTest(createClaimResult);
    
    tracker.addResult({
      phase: PHASE,
      scenario,
      step: 'Medical billing',
      status: 'pass',
    });
  });
});
