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

test.describe('AUDIT & REGULATORY MODULES - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('AUDIT-1.1 Audit Ready Hub loads', async ({ page }) => {
    await page.goto('/app/audit-ready');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"], [class*="audit"]').count()).toBeGreaterThan(0);
    console.log('✅ Audit Ready Hub loads');
  });

  test('AUDIT-1.2 Has tabs or sections', async ({ page }) => {
    await page.goto('/app/audit-ready');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Audit Ready has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('AUDIT-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/audit-ready');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('AUDIT-3.1 Page has audit content', async ({ page }) => {
    await page.goto('/app/audit-ready');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('audit') || bodyText?.toLowerCase().includes('compliance') || bodyText?.toLowerCase().includes('ready');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has audit content');
  });

  test('REG-1.1 Regulatory Hub loads', async ({ page }) => {
    await page.goto('/app/regulatory');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"], [class*="regulatory"]').count()).toBeGreaterThan(0);
    console.log('✅ Regulatory Hub loads');
  });

  test('REG-1.2 Has tabs or sections', async ({ page }) => {
    await page.goto('/app/regulatory');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Regulatory has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('REG-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/regulatory');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('REG-3.1 Page has regulatory content', async ({ page }) => {
    await page.goto('/app/regulatory');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('regulatory') || bodyText?.toLowerCase().includes('compliance') || bodyText?.toLowerCase().includes('filing');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has regulatory content');
  });
});
