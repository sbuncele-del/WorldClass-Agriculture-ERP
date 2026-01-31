import { test, expect } from '@playwright/test';

test('Full Login and Dashboard Test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  
  // Intercept network requests
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });

  // Go to the login page
  console.log('Navigating to login...');
  await page.goto('http://primesources.site/login');
  await page.waitForLoadState('networkidle');
  
  console.log('Page loaded, taking screenshot...');
  await page.screenshot({ path: 'test-1-login-page.png', fullPage: true });
  
  // Fill in login credentials
  console.log('Filling credentials...');
  await page.fill('input[name="email"], input[type="email"], #email', 'Sibusiso@sgbsgroup.co.za');
  await page.fill('input[name="password"], input[type="password"], #password', 'Masaphokati2025!');
  
  await page.screenshot({ path: 'test-2-filled-form.png', fullPage: true });
  
  // Click login button
  console.log('Clicking login...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation or response
  await page.waitForTimeout(5000);
  
  console.log('After login wait, URL:', page.url());
  await page.screenshot({ path: 'test-3-after-login.png', fullPage: true });
  
  // Check localStorage
  const authData = await page.evaluate(() => {
    return {
      token: localStorage.getItem('token'),
      accessToken: localStorage.getItem('accessToken'),
      user: localStorage.getItem('user'),
      allKeys: Object.keys(localStorage)
    };
  });
  console.log('LocalStorage auth data:', JSON.stringify(authData, null, 2));
  
  // If we got to dashboard, wait a bit more
  if (page.url().includes('dashboard')) {
    console.log('On dashboard, waiting for content...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-4-dashboard.png', fullPage: true });
    
    // Check for visible errors
    const pageContent = await page.content();
    if (pageContent.includes('Something went wrong')) {
      console.log('ERROR: "Something went wrong" message displayed');
      
      // Get any error details
      const errorDetails = await page.evaluate(() => {
        const errorDiv = document.querySelector('[class*="error"]');
        return errorDiv?.textContent || 'No error text found';
      });
      console.log('Error details:', errorDetails);
    }
    
    // Check what API calls were made
    const networkLogs = await page.evaluate(() => {
      return (window as any).__networkLogs || [];
    });
    console.log('Network logs:', networkLogs);
  }
  
  // Final state
  console.log('Final URL:', page.url());
  await page.screenshot({ path: 'test-5-final.png', fullPage: true });
});
