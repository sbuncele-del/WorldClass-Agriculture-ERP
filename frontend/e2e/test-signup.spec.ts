import { test, expect } from '@playwright/test';

test('debug signup flow', async ({ page }) => {
  // Listen to all network requests
  page.on('request', req => {
    if (req.url().includes('signup')) {
      console.log('REQUEST:', req.method(), req.url());
      console.log('BODY:', req.postData());
    }
  });
  
  page.on('response', async res => {
    if (res.url().includes('signup')) {
      console.log('RESPONSE:', res.status(), res.url());
      try {
        const body = await res.text();
        console.log('RESPONSE BODY:', body.slice(0, 500));
      } catch {}
    }
  });

  await page.goto('/signup');
  await page.waitForLoadState('networkidle');
  
  // Step 1: Email and password
  await page.fill('input[name="email"]', 'playwright' + Date.now() + '@test.com');
  await page.fill('input[name="password"]', 'Test123!');
  await page.fill('input[name="confirmPassword"], input[placeholder*="confirm" i]', 'Test123!');
  
  // Click Next
  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")');
  await nextBtn.first().click();
  await page.waitForTimeout(1000);
  
  // Step 2: Profile
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('input[name="companyName"]', 'Test Company');
  
  await nextBtn.first().click();
  await page.waitForTimeout(1000);
  
  // Step 3: Plan - click on one
  const planCard = page.locator('[class*="plan"], .plan-card').first();
  if (await planCard.count() > 0) {
    await planCard.click();
  }
  
  // Submit
  const submitBtn = page.locator('button:has-text("Create"), button:has-text("Sign Up"), button:has-text("Start")');
  await submitBtn.first().click();
  
  // Wait for result
  await page.waitForTimeout(5000);
  
  // Check for error
  const errorMsg = await page.locator('.error, [class*="error"], .ant-message-error').textContent().catch(() => 'none');
  console.log('ERROR MESSAGE:', errorMsg);
  
  // Screenshot
  await page.screenshot({ path: '/tmp/signup-test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/signup-test.png');
  console.log('Final URL:', page.url());
});
