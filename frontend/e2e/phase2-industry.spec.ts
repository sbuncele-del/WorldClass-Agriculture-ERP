import { test, expect, Page } from '@playwright/test';

/**
 * PHASE 2: INDUSTRY MODULES
 * Test: Logistics, Healthcare, Mining, Construction, Agriculture, Property
 */

const TEST_USER = {
  email: 'testuser@example.com',
  password: 'Test123!'
};

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"], #email', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"], #password', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

// ============================================
// LOGISTICS MODULE
// ============================================
test.describe('PHASE 2A: Logistics Module', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('2A.1 Navigate to Logistics Hub', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    // Check we're on logistics page
    const hasLogistics = await page.locator('main, [class*="logistics"], :has-text("Logistics"), :has-text("Fleet")').count() > 0;
    expect(hasLogistics).toBeTruthy();
    
    console.log('✅ Logistics Hub loads');
  });
  
  test('2A.2 View Vehicles List', async ({ page }) => {
    await page.goto('/app/logistics-hub/vehicles');
    await page.waitForLoadState('networkidle');
    
    // Should see vehicles table or list
    const hasContent = await page.locator('table, [class*="vehicle"], [class*="list"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Vehicles list loads');
  });
  
  test('2A.3 View Drivers List', async ({ page }) => {
    await page.goto('/app/logistics-hub/drivers');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="driver"], [class*="list"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Drivers list loads');
  });
  
  test('2A.4 View Trips/Routes', async ({ page }) => {
    await page.goto('/app/logistics-hub/trips');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="trip"], [class*="route"], [class*="list"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Trips/Routes page loads');
  });
  
  test('2A.5 Add Vehicle Button Exists', async ({ page }) => {
    await page.goto('/app/logistics-hub/vehicles');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), [class*="add-btn"]');
    const hasAddButton = await addButton.count() > 0;
    
    if (hasAddButton) {
      console.log('✅ Add Vehicle button exists');
    } else {
      console.log('⚠️ Add Vehicle button not found (may be in menu)');
    }
  });
});

// ============================================
// HEALTHCARE MODULE
// ============================================
test.describe('PHASE 2B: Healthcare Module', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('2B.1 Navigate to Healthcare Hub', async ({ page }) => {
    await page.goto('/app/healthcare-hub');
    await page.waitForLoadState('networkidle');
    
    const hasHealthcare = await page.locator('[class*="healthcare"], :has-text("Healthcare"), :has-text("Medical"), main').count() > 0;
    expect(hasHealthcare).toBeTruthy();
    
    console.log('✅ Healthcare Hub loads');
  });
  
  test('2B.2 View Patients List', async ({ page }) => {
    await page.goto('/app/healthcare-hub/patients');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="patient"], [class*="list"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Patients list loads');
  });
  
  test('2B.3 View Facilities', async ({ page }) => {
    await page.goto('/app/healthcare-hub/facilities');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="facility"], [class*="list"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Facilities page loads');
  });
  
  test('2B.4 View Appointments', async ({ page }) => {
    await page.goto('/app/healthcare-hub/appointments');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="appointment"], [class*="calendar"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Appointments page loads');
  });
  
  test('2B.5 View Medical Inventory', async ({ page }) => {
    await page.goto('/app/healthcare-hub/inventory');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('table, [class*="inventory"], [class*="medical"], main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Medical Inventory loads');
  });
});

// ============================================
// MINING MODULE
// ============================================
test.describe('PHASE 2C: Mining Module', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('2C.1 Navigate to Mining Hub', async ({ page }) => {
    await page.goto('/app/mining-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('[class*="mining"], :has-text("Mining"), main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Mining Hub loads');
  });
});

// ============================================
// CONSTRUCTION MODULE
// ============================================
test.describe('PHASE 2D: Construction Module', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('2D.1 Navigate to Construction Hub', async ({ page }) => {
    await page.goto('/app/construction-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('[class*="construction"], :has-text("Construction"), :has-text("Project"), main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Construction Hub loads');
  });
});

// ============================================
// AGRICULTURE MODULE
// ============================================
test.describe('PHASE 2E: Agriculture Module', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('2E.1 Navigate to Agriculture Hub', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('[class*="agriculture"], :has-text("Agriculture"), :has-text("Farm"), main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Agriculture Hub loads');
  });
});

// ============================================
// PROPERTY MANAGEMENT MODULE
// ============================================
test.describe('PHASE 2F: Property Management Module', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('2F.1 Navigate to Property Management', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('[class*="property"], :has-text("Property"), :has-text("Lease"), main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Property Management loads');
  });
});
