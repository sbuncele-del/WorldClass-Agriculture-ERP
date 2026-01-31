import { test, expect, Page } from '@playwright/test';

/**
 * PHASE 5: ADMIN & SETTINGS
 * Test: Dashboard, Settings, User Management, Audit
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
// MAIN DASHBOARD
// ============================================
test.describe('PHASE 5A: Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5A.1 Navigate to Dashboard', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Dashboard loads');
  });
  
  test('5A.2 Dashboard Shows KPIs or Metrics', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    
    const hasMetrics = await page.locator('[class*="card"], [class*="stat"], [class*="metric"], [class*="kpi"]').count() > 0;
    expect(hasMetrics).toBeTruthy();
    
    console.log('✅ Dashboard shows KPI/metrics content');
  });
});

// ============================================
// SETTINGS
// ============================================
test.describe('PHASE 5B: Settings', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5B.1 Navigate to Settings', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Settings page loads');
  });
});

// ============================================
// USERS
// ============================================
test.describe('PHASE 5C: Users', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5C.1 Navigate to Users', async ({ page }) => {
    await page.goto('/app/users');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Users page loads');
  });
});

// ============================================
// AUDIT
// ============================================
test.describe('PHASE 5D: Audit Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5D.1 Navigate to Audit Hub', async ({ page }) => {
    await page.goto('/app/audit-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Audit Hub loads');
  });
});

// ============================================
// ADMIN HUB
// ============================================
test.describe('PHASE 5E: Admin Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5E.1 Navigate to Admin Hub', async ({ page }) => {
    await page.goto('/app/admin');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Admin Hub loads');
  });
});

// ============================================
// REPORTS
// ============================================
test.describe('PHASE 5F: Reports', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5F.1 Navigate to Reports', async ({ page }) => {
    await page.goto('/app/reports');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Reports page loads');
  });
});

// ============================================
// AI ASSISTANT
// ============================================
test.describe('PHASE 5G: AI Assistant', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('5G.1 Navigate to AI Assistant', async ({ page }) => {
    await page.goto('/app/ai');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ AI Assistant loads');
  });
});
