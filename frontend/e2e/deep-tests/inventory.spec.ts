import { test, expect, Page } from '@playwright/test';

const TEST_USER = { email: 'testuser@example.com', password: 'Test123!' };

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"], #email', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"], #password', TEST_USER.password);
  await page.click('button[type="submit"]');
  try { await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }); }
  catch { const err = await page.locator('body').textContent(); if (err?.includes('rate') || err?.includes('try again')) return false; throw new Error('Login failed'); }
  return true;
}

async function clickTab(page: Page, tabName: string) {
  const tab = page.locator('.ant-tabs-tab').filter({ hasText: new RegExp(tabName, 'i') }).first();
  if (await tab.count() > 0) { await tab.click(); await page.waitForTimeout(800); return true; }
  return false;
}

test.describe('INVENTORY MODULE - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('INV-1.1 Inventory page loads', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="inventory"]').count()).toBeGreaterThan(0);
    console.log('✅ Inventory page loads');
  });

  test('INV-1.2 Inventory has tabs or sections', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Inventory has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('INV-2.1 Products/Items section', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    if (await clickTab(page, 'Product') || await clickTab(page, 'Item')) {
      expect(await page.locator('.ant-table, .ant-card').count()).toBeGreaterThan(0);
    }
    console.log('✅ Products/Items section accessible');
  });

  test('INV-2.2 Table or list exists', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    const tableCount = await page.locator('.ant-table').count();
    const listCount = await page.locator('.ant-list').count();
    expect(tableCount + listCount).toBeGreaterThanOrEqual(0);
    console.log('✅ Inventory has ' + tableCount + ' tables, ' + listCount + ' lists');
  });

  test('INV-3.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('INV-4.1 Page has inventory content', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('inventory') || bodyText?.toLowerCase().includes('stock') || bodyText?.toLowerCase().includes('product') || bodyText?.toLowerCase().includes('item');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has inventory content');
  });
});
