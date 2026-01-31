import { test, expect } from '@playwright/test';

test('Fresh Dashboard Test (No Cache)', async ({ browser }) => {
  // Create a fresh context with no cache
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  
  // Track errors
  const errors: string[] = [];
  const apiErrors: {url: string, status: number, body: string}[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`));
  
  page.on('response', async response => {
    if (response.status() >= 400 && response.url().includes('api')) {
      let body = '';
      try { body = await response.text(); } catch (e) {}
      apiErrors.push({ url: response.url(), status: response.status(), body });
    }
  });

  // Login
  await page.goto('http://primesources.site/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'Sibusiso@sgbsgroup.co.za');
  await page.fill('input[type="password"]', 'Masaphokati2025!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('✓ Reached dashboard');
  
  // Wait for all API calls
  await page.waitForTimeout(5000);
  
  // Report findings
  console.log('\n=== CONSOLE ERRORS ===');
  errors.forEach(e => console.log(e));
  
  console.log('\n=== API ERRORS ===');
  apiErrors.forEach(e => console.log(`${e.status} ${e.url}: ${e.body.substring(0, 150)}`));
  
  // Check if error message is displayed
  const errorVisible = await page.locator('text=Something went wrong').isVisible();
  console.log('\n=== UI STATE ===');
  console.log('Error message visible:', errorVisible);
  
  // Get page title and check sidebar
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check what's in the viewport
  const viewport = await page.evaluate(() => {
    return {
      hasErrorBoundary: !!document.querySelector('[class*="error-boundary"]'),
      hasDashboard: !!document.querySelector('[class*="dashboard"]'),
      bodyText: document.body.innerText.substring(0, 300)
    };
  });
  console.log('Viewport state:', JSON.stringify(viewport, null, 2));
  
  await page.screenshot({ path: 'fresh-test.png', fullPage: true });
  
  await context.close();
});
