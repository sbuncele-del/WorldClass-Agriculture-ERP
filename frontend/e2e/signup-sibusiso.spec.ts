import { test, expect } from '@playwright/test';

test('Create Sibusiso account on production', async ({ page }) => {
  test.setTimeout(60000);
  
  // Go to production signup
  await page.goto('https://d1gsy3508vpy61.cloudfront.net/signup');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Screenshot before starting
  await page.screenshot({ path: '/tmp/signup-1-start.png' });
  
  // Step 1: Account info
  await page.getByLabel('Email').fill('Sibusiso@sgbsgroup.co.za');
  await page.getByLabel('Password', { exact: true }).fill('Masaphokati2025!');
  await page.getByLabel('Confirm Password').fill('Masaphokati2025!');
  
  await page.screenshot({ path: '/tmp/signup-2-account.png' });
  
  // Click Continue
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Wait for step 2
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/signup-3-profile.png' });
  
  // Step 2: Profile
  await page.getByLabel('First Name').fill('Sibusiso');
  await page.getByLabel('Last Name').fill('Mavuso');
  await page.getByLabel('Company Name').fill('Masaphokati Equity Holdings');
  
  // Select country - it's a native select element
  await page.selectOption('#country', 'ZA');
  
  await page.screenshot({ path: '/tmp/signup-4-profile-filled.png' });
  
  // Click Continue
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Wait for step 3
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/signup-5-plan.png' });
  
  // Step 3: Select Enterprise plan - click the card
  const enterpriseCard = page.locator('[class*="plan"], [class*="card"], div').filter({ hasText: 'Enterprise' }).filter({ hasText: 'R2499' });
  await enterpriseCard.first().click();
  
  await page.screenshot({ path: '/tmp/signup-6-enterprise.png' });
  
  // Click Create Account button
  const createBtn = page.getByRole('button', { name: /Create Account/i });
  await createBtn.click();
  
  // Wait for API response with extended timeout
  await page.waitForTimeout(15000);
  
  // Final screenshot
  await page.screenshot({ path: '/tmp/signup-7-result.png' });
  
  // Check URL or success message
  const url = page.url();
  console.log('Final URL:', url);
  
  // Get any visible text
  const bodyText = await page.locator('body').innerText();
  console.log('Page content snippet:', bodyText.substring(0, 500));
});
