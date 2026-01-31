import { test, expect } from '@playwright/test';

test('Dashboard Debug Test', async ({ page }) => {
  // Track all failed requests
  const failedRequests: string[] = [];
  const errorResponses: {url: string, status: number, body?: string}[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
  });
  
  page.on('response', async response => {
    if (response.status() >= 400) {
      let body = '';
      try {
        body = await response.text();
      } catch (e) {}
      errorResponses.push({ url: response.url(), status: response.status(), body });
    }
  });

  // Login first
  await page.goto('http://primesources.site/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'Sibusiso@sgbsgroup.co.za');
  await page.fill('input[type="password"]', 'Masaphokati2025!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Reached dashboard');
  
  // Wait for API calls to complete
  await page.waitForTimeout(5000);
  
  // Report errors
  console.log('\n=== FAILED REQUESTS ===');
  failedRequests.forEach(r => console.log(r));
  
  console.log('\n=== ERROR RESPONSES ===');
  errorResponses.forEach(r => console.log(`${r.status} ${r.url}\n  Body: ${r.body?.substring(0, 200)}`));
  
  // Check page state
  const hasError = await page.locator('text=Something went wrong').isVisible();
  console.log('\n=== PAGE STATE ===');
  console.log('Shows error:', hasError);
  
  // Get the main content
  const mainContent = await page.evaluate(() => {
    const main = document.querySelector('main, [class*="content"], [class*="dashboard"]');
    return main?.textContent?.substring(0, 500) || 'No main content found';
  });
  console.log('Main content preview:', mainContent.substring(0, 300));
  
  await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
});
