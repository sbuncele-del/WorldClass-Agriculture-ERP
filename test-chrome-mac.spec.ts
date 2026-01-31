import { test, expect, chromium } from '@playwright/test';

test('Test with Chrome Mac settings', async () => {
  // Launch with same user agent as user's browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  
  // Capture all JS errors
  const jsErrors: string[] = [];
  page.on('pageerror', err => {
    jsErrors.push(err.message + '\n' + err.stack);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push('Console: ' + msg.text());
    }
  });

  // Login
  await page.goto('http://primesources.site/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'Sibusiso@sgbsgroup.co.za');
  await page.fill('input[type="password"]', 'Masaphokati2025!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('On dashboard');
  
  // Wait and capture errors
  await page.waitForTimeout(5000);
  
  console.log('\n=== JS ERRORS ===');
  jsErrors.forEach(e => console.log(e));
  
  // Check error boundary
  const errorVisible = await page.locator('text=Something went wrong').isVisible();
  console.log('Error visible:', errorVisible);
  
  // Dump the page HTML if error is visible
  if (errorVisible) {
    const html = await page.content();
    console.log('Page HTML preview:', html.substring(0, 2000));
  }
  
  await page.screenshot({ path: 'chrome-mac-test.png', fullPage: true });
  await browser.close();
});
