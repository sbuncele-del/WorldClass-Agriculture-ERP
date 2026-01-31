import { test, expect, Page } from '@playwright/test';

/**
 * PHASE 3: OPERATIONS MODULES
 * Test: Inventory, Warehouse, Assets, Projects
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
// INVENTORY MODULE
// ============================================
test.describe('PHASE 3A: Inventory Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('3A.1 Navigate to Inventory Hub', async ({ page }) => {
    await page.goto('/app/inventory-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Inventory Hub loads');
  });
  
  test('3A.2 Inventory Hub Has Content', async ({ page }) => {
    await page.goto('/app/inventory-hub');
    await page.waitForLoadState('networkidle');
    
    const hasTable = await page.locator('table, [class*="list"], [class*="card"]').count() > 0;
    expect(hasTable).toBeTruthy();
    
    console.log('✅ Inventory Hub shows content');
  });
});

// ============================================
// WAREHOUSE MODULE
// ============================================
test.describe('PHASE 3B: Warehouse Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('3B.1 Navigate to Warehouse Hub', async ({ page }) => {
    await page.goto('/app/warehouse-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Warehouse Hub loads');
  });
});

// ============================================
// ASSETS MODULE
// ============================================
test.describe('PHASE 3C: Assets Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('3C.1 Navigate to Assets Hub', async ({ page }) => {
    await page.goto('/app/assets-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Assets Hub loads');
  });
});

// ============================================
// PROJECTS MODULE
// ============================================
test.describe('PHASE 3D: Projects Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('3D.1 Navigate to Projects Hub', async ({ page }) => {
    await page.goto('/app/projects-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Projects Hub loads');
  });
});
