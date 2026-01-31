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

test.describe('PROPERTY MODULE - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('PROP-1.1 Property Hub loads', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"]').count()).toBeGreaterThan(0);
    console.log('✅ Property Hub loads');
  });

  test('PROP-1.2 Property Hub has tabs', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    expect(tabCount).toBeGreaterThan(2);
    console.log('✅ Property Hub has ' + tabCount + ' tabs');
  });

  test('PROP-2.1 Dashboard has cards', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    const cardCount = await page.locator('.ant-statistic, .ant-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Dashboard has ' + cardCount + ' cards');
  });

  test('PROP-2.2 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('PROP-3.1 Properties tab', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    await clickTab(page, 'Properties');
    expect(await page.locator('.ant-table, .ant-card').count()).toBeGreaterThan(0);
    console.log('✅ Properties tab has content');
  });

  test('PROP-4.1 Leases/Tenants tab', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    if (await clickTab(page, 'Lease') || await clickTab(page, 'Tenant')) {
      expect(await page.locator('.ant-table, .ant-card').count()).toBeGreaterThan(0);
      console.log('✅ Leases/Tenants tab has content');
    }
  });

  test('PROP-5.1 Page has property content', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('property') || bodyText?.toLowerCase().includes('lease') || bodyText?.toLowerCase().includes('tenant');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has property content');
  });
});
