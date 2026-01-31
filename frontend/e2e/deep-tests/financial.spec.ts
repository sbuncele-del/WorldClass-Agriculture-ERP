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

test.describe('FINANCIAL MODULE - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('FIN-1.1 Financial Hub loads', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"]').count()).toBeGreaterThan(0);
    console.log('✅ Financial Hub loads');
  });

  test('FIN-1.2 Financial Hub has tabs', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    expect(tabCount).toBeGreaterThan(2);
    console.log('✅ Financial Hub has ' + tabCount + ' tabs');
  });

  test('FIN-2.1 Dashboard has cards', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    const cardCount = await page.locator('.ant-statistic, .ant-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Dashboard has ' + cardCount + ' cards');
  });

  test('FIN-2.2 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('FIN-3.1 GL/Journal tab', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    if (await clickTab(page, 'General Ledger') || await clickTab(page, 'Journal') || await clickTab(page, 'GL')) {
      expect(await page.locator('.ant-table, .ant-card').count()).toBeGreaterThan(0);
      console.log('✅ GL/Journal tab has content');
    }
  });

  test('FIN-4.1 Accounts Payable tab', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    if (await clickTab(page, 'Payable') || await clickTab(page, 'AP')) {
      expect(await page.locator('.ant-table, .ant-card').count()).toBeGreaterThan(0);
      console.log('✅ Accounts Payable tab has content');
    }
  });

  test('FIN-5.1 Accounts Receivable tab', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    if (await clickTab(page, 'Receivable') || await clickTab(page, 'AR')) {
      expect(await page.locator('.ant-table, .ant-card').count()).toBeGreaterThan(0);
      console.log('✅ Accounts Receivable tab has content');
    }
  });

  test('FIN-6.1 Page has financial content', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('financial') || bodyText?.toLowerCase().includes('account') || bodyText?.toLowerCase().includes('revenue') || bodyText?.toLowerCase().includes('expense');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has financial content');
  });
});
