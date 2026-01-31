import { test, expect, Page, Download } from '@playwright/test';

const TEST_USER = { email: 'testuser@example.com', password: 'Test123!' };

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"], #email', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"], #password', TEST_USER.password);
  await page.click('button[type="submit"]');
  try { await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }); }
  catch { return false; }
  return true;
}

test.describe('EXPORT FUNCTIONALITY TEST', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    if (!(await login(page))) test.skip();
  });

  test('EXP-SALES: Sales Hub Export downloads CSV', async ({ page }) => {
    await page.goto('/app/sales-hub');
    await page.waitForLoadState('networkidle');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    // Find and click Export button
    const exportBtn = page.locator('button').filter({ hasText: /^Export$/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    
    // Wait for download
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    
    console.log(`✅ Sales Hub: Downloaded ${filename}`);
    expect(filename).toMatch(/sales.*\.csv$/i);
  });

  test('EXP-PURCHASE: Purchase Hub Export downloads CSV', async ({ page }) => {
    await page.goto('/app/purchase-hub');
    await page.waitForLoadState('networkidle');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportBtn = page.locator('button').filter({ hasText: /^Export$/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    
    console.log(`✅ Purchase Hub: Downloaded ${filename}`);
    expect(filename).toMatch(/purchase.*\.csv$/i);
  });

  test('EXP-LOGISTICS: Logistics Hub Export downloads CSV', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportBtn = page.locator('button').filter({ hasText: /^Export$/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    
    console.log(`✅ Logistics Hub: Downloaded ${filename}`);
    expect(filename).toMatch(/.*\.csv$/i);
  });

  test('EXP-WAREHOUSE: Warehouse Hub Export downloads CSV', async ({ page }) => {
    await page.goto('/app/warehouse');
    await page.waitForLoadState('networkidle');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportBtn = page.locator('button').filter({ hasText: /^Export$/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    
    console.log(`✅ Warehouse Hub: Downloaded ${filename}`);
    expect(filename).toMatch(/.*\.csv$/i);
  });

  test('EXP-AGRICULTURE: Agriculture Hub Export downloads CSV', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    // Go to Inputs tab to test export there
    const inputsTab = page.locator('.ant-tabs-tab').filter({ hasText: /Inputs/i }).first();
    if (await inputsTab.count() > 0) {
      await inputsTab.click();
      await page.waitForTimeout(1000);
    }
    
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportBtn = page.locator('button').filter({ hasText: /^Export$/i }).first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    
    console.log(`✅ Agriculture Hub: Downloaded ${filename}`);
    expect(filename).toMatch(/.*\.csv$/i);
  });
});
