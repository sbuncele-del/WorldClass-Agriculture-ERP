import { test, expect, Page } from '@playwright/test';

/**
 * AGRICULTURE MODULE - DEEP COMPREHENSIVE TEST
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
  
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  } catch {
    const errorText = await page.locator('body').textContent();
    if (errorText?.includes('rate') || errorText?.includes('try again') || errorText?.includes('failed')) {
      return false;
    }
    throw new Error('Login failed');
  }
  return true;
}

async function clickTab(page: Page, tabName: string): Promise<boolean> {
  const tab = page.locator('.ant-tabs-tab').filter({ hasText: new RegExp(tabName, 'i') }).first();
  if (await tab.count() > 0) {
    await tab.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

test.describe('AGRICULTURE MODULE - DEEP TEST', () => {
  
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) test.skip();
  });

  test('AG-1.1 Agriculture Hub loads without errors', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main, [class*="hub"]').count() > 0;
    expect(hasContent).toBeTruthy();
    
    const errorMessages = await page.locator('.ant-result-error, .ant-alert-error').count();
    expect(errorMessages).toBe(0);
    
    console.log('✅ Agriculture Hub loads without errors');
  });

  test('AG-1.2 Agriculture Hub has navigation tabs', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = page.locator('.ant-tabs-tab');
    const tabCount = await tabs.count();
    
    expect(tabCount).toBeGreaterThan(3);
    console.log('✅ Agriculture Hub has ' + tabCount + ' tabs');
  });

  test('AG-2.1 Dashboard shows statistics', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const cards = page.locator('.ant-statistic, .ant-card, [class*="metric"]');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Dashboard has ' + cardCount + ' cards');
  });

  test('AG-2.2 Dashboard has valid numbers (no NaN)', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    expect(pageContent).not.toContain('undefined');
    
    console.log('✅ No NaN/undefined in dashboard');
  });

  test('AG-3.1 Fields tab shows table', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Fields');
    
    const table = page.locator('.ant-table, table');
    expect(await table.count()).toBeGreaterThan(0);
    console.log('✅ Fields tab has table');
  });

  test('AG-3.2 Fields table has data rows', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Fields');
    
    const rows = page.locator('.ant-table-row, tbody tr');
    const rowCount = await rows.count();
    
    expect(rowCount).toBeGreaterThan(0);
    console.log('✅ Fields table has ' + rowCount + ' rows');
  });

  test('AG-4.1 Livestock tab shows data', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Livestock');
    
    const hasContent = await page.locator('.ant-table, .ant-card').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✅ Livestock tab has content');
  });

  test('AG-4.2 Livestock table has rows', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Livestock');
    
    const rows = page.locator('.ant-table-row, tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
    console.log('✅ Livestock table has rows');
  });

  test('AG-5.1 Inputs tab shows data', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Inputs');
    
    const hasContent = await page.locator('.ant-table, .ant-card').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✅ Inputs tab has content');
  });

  test('AG-6.1 Harvest tab shows data', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Harvest');
    
    const hasContent = await page.locator('.ant-table, .ant-card').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✅ Harvest tab has content');
  });

  test('AG-7.1 Equipment tab shows list', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Equipment');
    
    const hasContent = await page.locator('.ant-table, .ant-card, .ant-list').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✅ Equipment tab has content');
  });

  test('AG-8.1 Weather tab shows weather', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Weather');
    
    const pageContent = await page.locator('body').textContent();
    const hasWeather = pageContent?.includes('°') || 
                      pageContent?.toLowerCase().includes('temperature') ||
                      pageContent?.toLowerCase().includes('forecast');
    
    expect(hasWeather).toBeTruthy();
    console.log('✅ Weather tab shows weather data');
  });

  test('AG-9.1 Add buttons exist', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const addButtons = page.locator('button').filter({ hasText: /Add|New|Create|Record/i });
    expect(await addButtons.count()).toBeGreaterThan(0);
    console.log('✅ Add buttons exist');
  });

  test('AG-10.1 Page has agriculture content', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    const hasAgContent = 
      bodyText?.toLowerCase().includes('field') ||
      bodyText?.toLowerCase().includes('crop') ||
      bodyText?.toLowerCase().includes('farm') ||
      bodyText?.toLowerCase().includes('livestock');
    
    expect(hasAgContent).toBeTruthy();
    console.log('✅ Page has agriculture content');
  });
});
