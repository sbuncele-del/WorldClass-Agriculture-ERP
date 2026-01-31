import { test, expect, Page } from '@playwright/test';

/**
 * PHASE 4: CORE ACCOUNTING MODULES
 * Test: Sales Hub, Purchase Hub, Financial Hub, Banking Hub, HR Hub, Cash Management
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
// SALES HUB
// ============================================
test.describe('PHASE 4A: Sales Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4A.1 Navigate to Sales Hub', async ({ page }) => {
    await page.goto('/app/sales-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Sales Hub loads');
  });
  
  test('4A.2 Sales Hub Has Dashboard Content', async ({ page }) => {
    await page.goto('/app/sales-hub');
    await page.waitForLoadState('networkidle');
    
    const hasCards = await page.locator('[class*="card"], [class*="metric"], table').count() > 0;
    expect(hasCards).toBeTruthy();
    
    console.log('✅ Sales Hub shows dashboard content');
  });
});

// ============================================
// PURCHASE HUB
// ============================================
test.describe('PHASE 4B: Purchase Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4B.1 Navigate to Purchase Hub', async ({ page }) => {
    await page.goto('/app/purchase-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Purchase Hub loads');
  });
});

// ============================================
// FINANCIAL HUB
// ============================================
test.describe('PHASE 4C: Financial Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4C.1 Navigate to Financial Hub', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Financial Hub loads');
  });
  
  test('4C.2 Financial Hub Shows Accounting Content', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    
    const hasFinancial = await page.locator(':has-text("Account"), :has-text("Ledger"), :has-text("Journal"), table, [class*="card"]').count() > 0;
    expect(hasFinancial).toBeTruthy();
    
    console.log('✅ Financial Hub shows accounting content');
  });
});

// ============================================
// BANKING HUB
// ============================================
test.describe('PHASE 4D: Banking Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4D.1 Navigate to Banking Hub', async ({ page }) => {
    await page.goto('/app/banking-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Banking Hub loads');
  });
});

// ============================================
// CASH MANAGEMENT
// ============================================
test.describe('PHASE 4E: Cash Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4E.1 Navigate to Cash Management', async ({ page }) => {
    await page.goto('/app/cash');
    await page.waitForLoadState('networkidle');
    
    // Cash Management redirects to /cash/dashboard
    const url = page.url();
    expect(url).toMatch(/cash/);
    
    console.log('✅ Cash Management route accessible');
  });
});

// ============================================
// TREASURY
// ============================================
test.describe('PHASE 4F: Treasury', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4F.1 Navigate to Treasury', async ({ page }) => {
    await page.goto('/app/treasury');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Treasury loads');
  });
});

// ============================================
// HR HUB
// ============================================
test.describe('PHASE 4G: HR Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4G.1 Navigate to HR Hub', async ({ page }) => {
    await page.goto('/app/hr-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ HR Hub loads');
  });
});

// ============================================
// SARS SENTINEL
// ============================================
test.describe('PHASE 4H: SARS Sentinel', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('4H.1 Navigate to SARS Sentinel', async ({ page }) => {
    await page.goto('/app/sars');
    await page.waitForLoadState('networkidle');
    
    // SARS Sentinel redirects to /sars/dashboard
    const url = page.url();
    expect(url).toMatch(/sars/);
    
    console.log('✅ SARS Sentinel route accessible');
  });
});
