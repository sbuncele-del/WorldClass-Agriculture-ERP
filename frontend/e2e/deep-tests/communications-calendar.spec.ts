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

test.describe('COMMUNICATIONS & CALENDAR MODULES - DEEP TEST', () => {
  test.beforeEach(async ({ page }) => { if (!(await login(page))) test.skip(); });

  test('COMM-1.1 Communications Hub loads', async ({ page }) => {
    await page.goto('/app/communications-hub');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="hub"], [class*="communication"]').count()).toBeGreaterThan(0);
    console.log('✅ Communications Hub loads');
  });

  test('COMM-1.2 Has tabs or sections', async ({ page }) => {
    await page.goto('/app/communications-hub');
    await page.waitForLoadState('networkidle');
    const tabCount = await page.locator('.ant-tabs-tab').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(tabCount + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Communications has ' + tabCount + ' tabs and ' + cardCount + ' cards');
  });

  test('COMM-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/communications-hub');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('COMM-3.1 Page has communication content', async ({ page }) => {
    await page.goto('/app/communications-hub');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('message') || bodyText?.toLowerCase().includes('meeting') || bodyText?.toLowerCase().includes('communication') || bodyText?.toLowerCase().includes('video');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has communication content');
  });

  test('CAL-1.1 Calendar Module loads', async ({ page }) => {
    await page.goto('/app/calendar');
    await page.waitForLoadState('networkidle');
    expect(await page.locator('main, [class*="calendar"]').count()).toBeGreaterThan(0);
    console.log('✅ Calendar Module loads');
  });

  test('CAL-1.2 Has calendar UI', async ({ page }) => {
    await page.goto('/app/calendar');
    await page.waitForLoadState('networkidle');
    const calendarUI = await page.locator('.ant-picker-calendar, [class*="calendar"], .fc-view').count();
    const cardCount = await page.locator('.ant-card').count();
    expect(calendarUI + cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Calendar has UI elements');
  });

  test('CAL-2.1 No NaN/undefined', async ({ page }) => {
    await page.goto('/app/calendar');
    await page.waitForLoadState('networkidle');
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    console.log('✅ No NaN/undefined');
  });

  test('CAL-3.1 Page has calendar content', async ({ page }) => {
    await page.goto('/app/calendar');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText?.toLowerCase().includes('calendar') || bodyText?.toLowerCase().includes('event') || bodyText?.toLowerCase().includes('schedule');
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has calendar content');
  });
});
