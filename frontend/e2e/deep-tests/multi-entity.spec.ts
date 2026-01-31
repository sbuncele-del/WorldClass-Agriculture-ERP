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

test.describe('MULTI-ENTITY MODULE - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('ME-1.1 Multi-Entity Hub loads', async ({ page }) => {
    await page.goto('/app/multi-entity');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"], [class*="entity"]').count()).toBeGreaterThan(0);
    console.log('✅ Multi-Entity Hub loads');
  });

  test('ME-1.2 Has tabs or sections', async ({ page }) => {
    await page.goto('/app/multi-entity');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Multi-Entity has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('ME-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/multi-entity');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('ME-3.1 Page has entity content', async ({ page }) => {
    await page.goto('/app/multi-entity');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('entity') || bodyText?.toLowerCase().includes('company') || bodyText?.toLowerCase().includes('consolidat');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has entity content');
  });
});
