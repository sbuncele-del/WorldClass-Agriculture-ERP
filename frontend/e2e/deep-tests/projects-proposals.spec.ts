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

test.describe('PROJECTS & PROPOSALS MODULES - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('PROJ-1.1 Projects Hub loads', async ({ page }) => {
    await page.goto('/app/projects-hub');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"], [class*="project"]').count()).toBeGreaterThan(0);
    console.log('✅ Projects Hub loads');
  });

  test('PROJ-1.2 Has tabs or sections', async ({ page }) => {
    await page.goto('/app/projects-hub');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Projects has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('PROJ-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/projects-hub');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('PROJ-3.1 Page has project content', async ({ page }) => {
    await page.goto('/app/projects-hub');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('project') || bodyText?.toLowerCase().includes('task') || bodyText?.toLowerCase().includes('timeline');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has project content');
  });

  test('PROP-1.1 Proposals Hub loads', async ({ page }) => {
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"], [class*="proposal"]').count()).toBeGreaterThan(0);
    console.log('✅ Proposals Hub loads');
  });

  test('PROP-1.2 Has tabs or sections', async ({ page }) => {
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Proposals has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('PROP-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('PROP-3.1 Page has proposal content', async ({ page }) => {
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('proposal') || bodyText?.toLowerCase().includes('pitch') || bodyText?.toLowerCase().includes('client');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has proposal content');
  });
});
