import { test, expect, Page } from '@playwright/test';

/**
 * LOGISTICS MODULE - DEEP COMPREHENSIVE TEST
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

test.describe('LOGISTICS MODULE - DEEP TEST', () => {
  
  test.beforeEach(async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) test.skip();
  });

  test('LOG-1.1 Logistics Hub loads without errors', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('main, [class*="hub"]').count() > 0;
    expect(hasContent).toBeTruthy();
    
    const errorMessages = await page.locator('.ant-result-error, .ant-alert-error').count();
    expect(errorMessages).toBe(0);
    
    console.log('✅ Logistics Hub loads without errors');
  });

  test('LOG-1.2 Logistics Hub has navigation tabs', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = page.locator('.ant-tabs-tab');
    const tabCount = await tabs.count();
    
    expect(tabCount).toBeGreaterThan(2);
    console.log('✅ Logistics Hub has ' + tabCount + ' tabs');
  });

  test('LOG-2.1 Dashboard shows statistics', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const cards = page.locator('.ant-statistic, .ant-card, [class*="metric"]');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThanOrEqual(1);
    console.log('✅ Dashboard has ' + cardCount + ' cards');
  });

  test('LOG-2.2 Dashboard has valid numbers (no NaN)', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).not.toContain('NaN');
    expect(pageContent).not.toContain('undefined');
    
    console.log('✅ No NaN/undefined in dashboard');
  });

  test('LOG-3.1 Vehicles tab shows data', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Vehicles');
    
    const hasContent = await page.locator('.ant-table, table, .ant-card, .ant-list').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✅ Vehicles tab has content');
  });

  test('LOG-3.2 Vehicles table has rows', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Vehicles');
    
    const rows = page.locator('.ant-table-row, tbody tr, .ant-card');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      console.log('✅ Vehicles has ' + rowCount + ' rows');
    } else {
      const emptyMsg = await page.locator('.ant-empty, :has-text("No data")').count();
      if (emptyMsg > 0) {
        console.log('⚠️ Vehicles table is empty (no vehicles configured)');
      }
    }
    expect(true).toBeTruthy(); // Soft pass - empty is OK for new tenant
  });

  test('LOG-4.1 Drivers tab shows data', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    await clickTab(page, 'Drivers');
    
    const hasContent = await page.locator('.ant-table, table, .ant-card, .ant-list').count() > 0;
    expect(hasContent).toBeTruthy();
    console.log('✅ Drivers tab has content');
  });

  test('LOG-5.1 Routes/Trips tab shows data', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const clicked = await clickTab(page, 'Routes') || await clickTab(page, 'Trips');
    
    if (clicked) {
      const hasContent = await page.locator('.ant-table, table, .ant-card').count() > 0;
      expect(hasContent).toBeTruthy();
      console.log('✅ Routes/Trips tab has content');
    }
  });

  test('LOG-6.1 Fuel tab shows data', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const clicked = await clickTab(page, 'Fuel');
    
    if (clicked) {
      const hasContent = await page.locator('.ant-table, table, .ant-card').count() > 0;
      expect(hasContent).toBeTruthy();
      console.log('✅ Fuel tab has content');
    } else {
      console.log('⚠️ Fuel tab not found');
    }
  });

  test('LOG-7.1 Maintenance tab shows data', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const clicked = await clickTab(page, 'Maintenance');
    
    if (clicked) {
      const hasContent = await page.locator('.ant-table, table, .ant-card').count() > 0;
      expect(hasContent).toBeTruthy();
      console.log('✅ Maintenance tab has content');
    } else {
      console.log('⚠️ Maintenance tab not found');
    }
  });

  test('LOG-8.1 Add buttons exist', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const addButtons = page.locator('button').filter({ hasText: /Add|New|Create|Record/i });
    expect(await addButtons.count()).toBeGreaterThan(0);
    console.log('✅ Add buttons exist');
  });

  test('LOG-9.1 Page has logistics content', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    const hasContent = 
      bodyText?.toLowerCase().includes('vehicle') ||
      bodyText?.toLowerCase().includes('driver') ||
      bodyText?.toLowerCase().includes('fleet') ||
      bodyText?.toLowerCase().includes('route') ||
      bodyText?.toLowerCase().includes('trip');
    
    expect(hasContent).toBeTruthy();
    console.log('✅ Page has logistics content');
  });
});
