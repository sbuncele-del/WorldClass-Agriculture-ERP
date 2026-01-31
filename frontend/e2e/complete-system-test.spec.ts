/**
 * COMPREHENSIVE ERP SYSTEM TEST - From Scratch
 * 
 * Complete user journey testing starting from signup:
 * 1. Sign Up (New Account Creation)
 * 2. Email Verification (if applicable)
 * 3. Login
 * 4. Dashboard Navigation
 * 5. All Module Access
 * 6. Admin Functions (if admin)
 * 7. Logout
 * 
 * Run: TEST_URL=https://d1gsy3508vpy61.cloudfront.net npx playwright test e2e/complete-system-test.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

// Generate unique test data
const timestamp = Date.now();
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  email: `testuser.${timestamp}@testcompany.co.za`,
  password: 'TestPass123!',
  companyName: `Test Company ${timestamp}`,
  phone: '+27 82 123 4567',
};

// Results tracker
const testResults: { step: string; status: 'pass' | 'fail' | 'skip'; details: string }[] = [];

function logResult(step: string, status: 'pass' | 'fail' | 'skip', details: string) {
  testResults.push({ step, status, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${icon} ${step}: ${details}`);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/complete-test/${name}.png`, 
    fullPage: true 
  });
}

test.describe('Complete ERP System Test - From Scratch', () => {
  test.setTimeout(300000); // 5 minutes for full test
  
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterAll(async () => {
    // Print final report
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPLETE SYSTEM TEST RESULTS');
    console.log('='.repeat(70));
    
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const skipped = testResults.filter(r => r.status === 'skip').length;
    
    console.log(`\n✅ Passed: ${passed}  ❌ Failed: ${failed}  ⏭️ Skipped: ${skipped}\n`);
    
    testResults.forEach(r => {
      const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️';
      console.log(`  ${icon} ${r.step}`);
      if (r.status === 'fail') {
        console.log(`     → ${r.details}`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
    await page.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: SIGNUP PROCESS
  // ═══════════════════════════════════════════════════════════════════════════

  test('1.1 - Navigate to Signup Page', async () => {
    console.log('\n📍 PHASE 1: SIGNUP PROCESS\n');
    
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await screenshot(page, '1.1-signup-page');
    
    const signupFormVisible = await page.locator('form').first().isVisible();
    
    if (signupFormVisible) {
      logResult('Signup Page Load', 'pass', 'Signup form is visible');
    } else {
      // Try to find signup link from login page
      await page.goto('/login');
      const signupLink = page.locator('a[href*="signup"], a:has-text("Sign up"), a:has-text("Register")');
      
      if (await signupLink.first().isVisible()) {
        await signupLink.first().click();
        await page.waitForLoadState('networkidle');
        logResult('Signup Page Load', 'pass', 'Navigated via signup link');
      } else {
        logResult('Signup Page Load', 'fail', 'Could not find signup page');
      }
    }
    
    await screenshot(page, '1.1-signup-loaded');
  });

  test('1.2 - Identify Signup Form Fields', async () => {
    const fields = {
      'First Name': ['input[name="firstName"]', 'input[placeholder*="First"]', '#firstName', 'input[name="first_name"]'],
      'Last Name': ['input[name="lastName"]', 'input[placeholder*="Last"]', '#lastName', 'input[name="last_name"]'],
      'Email': ['input[name="email"]', 'input[type="email"]', '#email'],
      'Password': ['input[name="password"]', 'input[type="password"]', '#password'],
      'Confirm Password': ['input[name="confirmPassword"]', 'input[name="confirm_password"]', '#confirmPassword'],
      'Company Name': ['input[name="companyName"]', 'input[name="company"]', '#companyName', 'input[placeholder*="Company"]'],
      'Phone': ['input[name="phone"]', 'input[type="tel"]', '#phone'],
    };
    
    const foundFields: string[] = [];
    const missingFields: string[] = [];
    
    for (const [fieldName, selectors] of Object.entries(fields)) {
      let found = false;
      for (const selector of selectors) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          foundFields.push(fieldName);
          found = true;
          break;
        }
      }
      if (!found) {
        missingFields.push(fieldName);
      }
    }
    
    console.log('  Found fields:', foundFields);
    console.log('  Missing fields:', missingFields);
    
    logResult('Signup Form Fields', foundFields.length >= 3 ? 'pass' : 'fail', 
      `Found ${foundFields.length} fields: ${foundFields.join(', ')}`);
    
    await screenshot(page, '1.2-signup-fields');
  });

  test('1.3 - Fill Signup Form', async () => {
    const fillAttempts: string[] = [];
    
    // Try to fill each field
    const fieldMappings = [
      { value: TEST_USER.firstName, selectors: ['input[name="firstName"]', 'input[placeholder*="First"]', '#firstName', 'input[name="first_name"]'] },
      { value: TEST_USER.lastName, selectors: ['input[name="lastName"]', 'input[placeholder*="Last"]', '#lastName', 'input[name="last_name"]'] },
      { value: TEST_USER.email, selectors: ['input[name="email"]', 'input[type="email"]:not([readonly])', '#email'] },
      { value: TEST_USER.password, selectors: ['input[name="password"]:not([name*="confirm"])', 'input[type="password"]:first-of-type', '#password'] },
      { value: TEST_USER.password, selectors: ['input[name="confirmPassword"]', 'input[name="confirm_password"]', '#confirmPassword', 'input[type="password"]:nth-of-type(2)'] },
      { value: TEST_USER.companyName, selectors: ['input[name="companyName"]', 'input[name="company"]', '#companyName', 'input[placeholder*="Company"]', 'input[name="organization"]'] },
      { value: TEST_USER.phone, selectors: ['input[name="phone"]', 'input[type="tel"]', '#phone'] },
    ];
    
    for (const { value, selectors } of fieldMappings) {
      for (const selector of selectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            await element.fill(value);
            fillAttempts.push(selector.split('[')[1]?.split(']')[0] || selector);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }
    
    console.log('  Filled fields:', fillAttempts);
    logResult('Fill Signup Form', fillAttempts.length >= 2 ? 'pass' : 'fail', 
      `Filled ${fillAttempts.length} fields`);
    
    await screenshot(page, '1.3-signup-filled');
  });

  test('1.4 - Check for Terms & Conditions Checkbox', async () => {
    const checkboxSelectors = [
      'input[type="checkbox"]',
      '.ant-checkbox-input',
      '[role="checkbox"]',
      'input[name*="terms"]',
      'input[name*="agree"]',
    ];
    
    let checkboxFound = false;
    for (const selector of checkboxSelectors) {
      const checkbox = page.locator(selector).first();
      if (await checkbox.isVisible().catch(() => false)) {
        try {
          await checkbox.check();
          checkboxFound = true;
          console.log('  Checked terms checkbox');
          break;
        } catch (e) {
          // Try clicking instead
          try {
            await checkbox.click();
            checkboxFound = true;
            break;
          } catch (e2) {
            // Continue
          }
        }
      }
    }
    
    logResult('Terms Checkbox', checkboxFound ? 'pass' : 'skip', 
      checkboxFound ? 'Checkbox found and checked' : 'No checkbox found (may not be required)');
    
    await screenshot(page, '1.4-checkbox');
  });

  test('1.5 - Submit Signup Form', async () => {
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign Up")',
      'button:has-text("Register")',
      'button:has-text("Create Account")',
      'button:has-text("Get Started")',
      '.ant-btn-primary',
    ];
    
    let submitted = false;
    let submitButton = null;
    
    for (const selector of submitSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        submitButton = button;
        const buttonText = await button.textContent();
        console.log(`  Found submit button: "${buttonText}"`);
        break;
      }
    }
    
    if (submitButton) {
      // Store current URL
      const beforeUrl = page.url();
      
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      const afterUrl = page.url();
      
      // Check for success indicators
      const successIndicators = [
        page.locator('.ant-message-success'),
        page.locator('.success-message'),
        page.locator('text=successfully'),
        page.locator('text=verification'),
        page.locator('text=check your email'),
        page.locator('text=account created'),
      ];
      
      let successFound = false;
      for (const indicator of successIndicators) {
        if (await indicator.first().isVisible().catch(() => false)) {
          successFound = true;
          const text = await indicator.first().textContent();
          console.log(`  Success message: "${text}"`);
          break;
        }
      }
      
      // Check for error indicators
      const errorIndicators = [
        page.locator('.ant-message-error'),
        page.locator('.error-message'),
        page.locator('.ant-form-item-explain-error'),
        page.locator('[role="alert"]'),
      ];
      
      let errorFound = false;
      let errorText = '';
      for (const indicator of errorIndicators) {
        if (await indicator.first().isVisible().catch(() => false)) {
          errorFound = true;
          errorText = await indicator.first().textContent() || 'Unknown error';
          console.log(`  Error message: "${errorText}"`);
          break;
        }
      }
      
      if (successFound || (afterUrl !== beforeUrl && !afterUrl.includes('signup'))) {
        logResult('Submit Signup', 'pass', 'Form submitted successfully');
        submitted = true;
      } else if (errorFound) {
        logResult('Submit Signup', 'fail', `Error: ${errorText}`);
      } else {
        logResult('Submit Signup', 'fail', 'No success/error indicator found');
      }
    } else {
      logResult('Submit Signup', 'fail', 'Submit button not found');
    }
    
    await screenshot(page, '1.5-after-submit');
  });

  test('1.6 - Check Post-Signup State', async () => {
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);
    
    // Possible post-signup states
    const states = {
      'Email Verification Required': ['verify', 'verification', 'confirm'],
      'Login Page': ['login'],
      'Dashboard': ['dashboard', 'app', 'home'],
      'Onboarding': ['onboarding', 'setup', 'welcome'],
    };
    
    let detectedState = 'Unknown';
    for (const [stateName, keywords] of Object.entries(states)) {
      if (keywords.some(kw => currentUrl.toLowerCase().includes(kw))) {
        detectedState = stateName;
        break;
      }
    }
    
    // Also check page content
    const pageText = await page.textContent('body') || '';
    if (pageText.toLowerCase().includes('verify your email') || pageText.toLowerCase().includes('check your email')) {
      detectedState = 'Email Verification Required';
    }
    
    console.log(`  Post-signup state: ${detectedState}`);
    logResult('Post-Signup State', 'pass', detectedState);
    
    await screenshot(page, '1.6-post-signup');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: LOGIN PROCESS
  // ═══════════════════════════════════════════════════════════════════════════

  test('2.1 - Navigate to Login Page', async () => {
    console.log('\n📍 PHASE 2: LOGIN PROCESS\n');
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    const loginFormVisible = await page.locator('input[type="email"], input[name="email"]').first().isVisible();
    
    logResult('Login Page Load', loginFormVisible ? 'pass' : 'fail', 
      loginFormVisible ? 'Login form visible' : 'Login form not found');
    
    await screenshot(page, '2.1-login-page');
  });

  test('2.2 - Test Login with Invalid Credentials', async () => {
    // Fill with wrong credentials
    await page.fill('input[name="email"], input[type="email"]', 'invalid@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();
    
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorVisible = await page.locator('.ant-message-error, .error-message, [role="alert"], .text-red, .text-danger').first().isVisible().catch(() => false);
    
    logResult('Invalid Login Error', errorVisible ? 'pass' : 'fail',
      errorVisible ? 'Error message displayed correctly' : 'No error message shown');
    
    await screenshot(page, '2.2-invalid-login');
  });

  test('2.3 - Test Login with Test User Credentials', async () => {
    // Clear and fill with our test user
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    
    const beforeUrl = page.url();
    await loginButton.click();
    
    await page.waitForTimeout(3000);
    
    const afterUrl = page.url();
    
    if (!afterUrl.includes('login')) {
      logResult('Login Success', 'pass', `Redirected to: ${afterUrl}`);
    } else {
      // Check if email verification is required
      const pageText = await page.textContent('body') || '';
      if (pageText.includes('verify') || pageText.includes('verification')) {
        logResult('Login Success', 'skip', 'Email verification required');
      } else {
        logResult('Login Success', 'fail', 'Still on login page - credentials may be invalid');
      }
    }
    
    await screenshot(page, '2.3-login-attempt');
  });

  test('2.4 - Check Forgot Password Link', async () => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a[href*="forgot"], a[href*="reset"]');
    
    if (await forgotPasswordLink.first().isVisible()) {
      await forgotPasswordLink.first().click();
      await page.waitForLoadState('networkidle');
      
      const resetFormVisible = await page.locator('input[type="email"], input[name="email"]').first().isVisible();
      
      logResult('Forgot Password', resetFormVisible ? 'pass' : 'fail',
        resetFormVisible ? 'Reset password form loaded' : 'Reset form not found');
    } else {
      logResult('Forgot Password', 'skip', 'Forgot password link not visible');
    }
    
    await screenshot(page, '2.4-forgot-password');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: LANDING PAGE & NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════

  test('3.1 - Check Landing Page', async () => {
    console.log('\n📍 PHASE 3: LANDING PAGE & NAVIGATION\n');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const elements = {
      'Logo': ['img[alt*="logo"], .logo, [data-testid="logo"]', await page.locator('img[alt*="logo"], .logo').first().isVisible().catch(() => false)],
      'Navigation Menu': ['.ant-menu, nav, .navbar', await page.locator('.ant-menu, nav, .navbar').first().isVisible().catch(() => false)],
      'Login Button': ['a[href*="login"], button:has-text("Login")', await page.locator('a[href*="login"], button:has-text("Login")').first().isVisible().catch(() => false)],
      'Signup Button': ['a[href*="signup"], button:has-text("Sign")', await page.locator('a[href*="signup"], button:has-text("Sign")').first().isVisible().catch(() => false)],
      'Hero Section': ['.hero, .banner, h1', await page.locator('.hero, .banner, h1').first().isVisible().catch(() => false)],
    };
    
    const found: string[] = [];
    const missing: string[] = [];
    
    for (const [name, [selector, visible]] of Object.entries(elements)) {
      if (visible) {
        found.push(name);
      } else {
        missing.push(name);
      }
    }
    
    console.log('  Found elements:', found);
    console.log('  Missing elements:', missing);
    
    logResult('Landing Page Elements', found.length >= 2 ? 'pass' : 'fail',
      `Found ${found.length}/${Object.keys(elements).length} elements`);
    
    await screenshot(page, '3.1-landing-page');
  });

  test('3.2 - Check Demo Mode', async () => {
    // Look for demo link/button
    const demoLocators = [
      page.locator('a:has-text("Demo")'),
      page.locator('button:has-text("Demo")'),
      page.locator('a:has-text("Try")'),
      page.locator('[href*="demo"]'),
    ];
    
    let demoFound = false;
    for (const locator of demoLocators) {
      if (await locator.first().isVisible().catch(() => false)) {
        console.log('  Found demo option');
        await locator.first().click();
        await page.waitForTimeout(2000);
        demoFound = true;
        break;
      }
    }
    
    if (demoFound) {
      const currentUrl = page.url();
      logResult('Demo Mode', 'pass', `Demo accessed - URL: ${currentUrl}`);
    } else {
      logResult('Demo Mode', 'skip', 'No demo option found');
    }
    
    await screenshot(page, '3.2-demo-mode');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: MAIN APP NAVIGATION (After Login/Demo)
  // ═══════════════════════════════════════════════════════════════════════════

  test('4.1 - Check Dashboard Access', async () => {
    console.log('\n📍 PHASE 4: MAIN APP NAVIGATION\n');
    
    // Try to access dashboard
    await page.goto('/app/dashboard', { waitUntil: 'networkidle' });
    
    const dashboardElements = {
      'Stats/Cards': ['.ant-card, .stat-card, .dashboard-card', await page.locator('.ant-card, .stat-card').first().isVisible().catch(() => false)],
      'Charts': ['canvas, .chart, .recharts', await page.locator('canvas, .chart, .recharts-wrapper').first().isVisible().catch(() => false)],
      'Navigation': ['.ant-menu, .sidebar', await page.locator('.ant-menu, .sidebar').first().isVisible().catch(() => false)],
    };
    
    const found: string[] = [];
    for (const [name, [selector, visible]] of Object.entries(dashboardElements)) {
      if (visible) found.push(name);
    }
    
    // Check if redirected to login
    if (page.url().includes('login')) {
      logResult('Dashboard Access', 'fail', 'Redirected to login - authentication required');
    } else {
      logResult('Dashboard Access', found.length > 0 ? 'pass' : 'fail',
        `Dashboard elements found: ${found.join(', ') || 'None'}`);
    }
    
    await screenshot(page, '4.1-dashboard');
  });

  test('4.2 - Scan All Navigation Links', async () => {
    // Get all navigation links
    const menuItems = await page.locator('.ant-menu-item, .nav-item, [role="menuitem"], a[href^="/app"]').all();
    
    const links: { text: string; href: string }[] = [];
    
    for (const item of menuItems.slice(0, 20)) { // Limit to first 20
      try {
        const text = await item.textContent() || '';
        const href = await item.getAttribute('href') || '';
        if (text.trim()) {
          links.push({ text: text.trim(), href });
        }
      } catch (e) {
        // Skip
      }
    }
    
    console.log('  Navigation links found:');
    links.forEach(l => console.log(`    - ${l.text}: ${l.href}`));
    
    logResult('Navigation Links', links.length > 0 ? 'pass' : 'skip',
      `Found ${links.length} navigation items`);
    
    await screenshot(page, '4.2-navigation');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: MODULE ACCESS TEST
  // ═══════════════════════════════════════════════════════════════════════════

  test('5.1 - Test Module Routes', async () => {
    console.log('\n📍 PHASE 5: MODULE ACCESS TEST\n');
    
    const modules = [
      { name: 'Sales Hub', path: '/app/sales' },
      { name: 'Inventory', path: '/app/inventory' },
      { name: 'Financial', path: '/app/financial' },
      { name: 'HR', path: '/app/hr' },
      { name: 'Projects', path: '/app/projects' },
      { name: 'Admin', path: '/app/admin' },
      { name: 'Warehouse', path: '/app/warehouse' },
      { name: 'Manufacturing', path: '/app/manufacturing' },
      { name: 'Compliance', path: '/app/compliance' },
      { name: 'Communications', path: '/app/communications' },
    ];
    
    const accessResults: { module: string; status: string }[] = [];
    
    for (const module of modules) {
      try {
        await page.goto(module.path, { waitUntil: 'networkidle', timeout: 10000 });
        
        const currentUrl = page.url();
        
        if (currentUrl.includes('login')) {
          accessResults.push({ module: module.name, status: '🔒 Auth Required' });
        } else if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
          accessResults.push({ module: module.name, status: '❌ Not Found' });
        } else {
          // Check if page has content
          const hasContent = await page.locator('.ant-card, h1, h2, .page-content, main').first().isVisible().catch(() => false);
          accessResults.push({ module: module.name, status: hasContent ? '✅ Accessible' : '⚠️ Empty' });
        }
      } catch (e) {
        accessResults.push({ module: module.name, status: '❌ Error' });
      }
    }
    
    console.log('\n  Module Access Results:');
    accessResults.forEach(r => console.log(`    ${r.status} ${r.module}`));
    
    const accessible = accessResults.filter(r => r.status.includes('✅')).length;
    logResult('Module Access', accessible > 0 ? 'pass' : 'fail',
      `${accessible}/${modules.length} modules accessible`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: BUTTON FUNCTIONALITY TEST
  // ═══════════════════════════════════════════════════════════════════════════

  test('6.1 - Test All Buttons on Current Page', async () => {
    console.log('\n📍 PHASE 6: BUTTON FUNCTIONALITY TEST\n');
    
    // Go to a page with buttons (try dashboard or landing)
    await page.goto('/app/dashboard', { waitUntil: 'networkidle' }).catch(() => {});
    
    if (page.url().includes('login')) {
      await page.goto('/', { waitUntil: 'networkidle' });
    }
    
    // Find all buttons
    const buttons = await page.locator('button:visible').all();
    
    const buttonInfo: { text: string; clickable: boolean; disabled: boolean }[] = [];
    
    for (const button of buttons.slice(0, 15)) { // Test first 15 buttons
      try {
        const text = await button.textContent() || 'No text';
        const disabled = await button.isDisabled();
        const clickable = await button.isEnabled();
        
        buttonInfo.push({
          text: text.trim().substring(0, 30),
          clickable,
          disabled,
        });
      } catch (e) {
        // Skip
      }
    }
    
    console.log('  Buttons found:');
    buttonInfo.forEach(b => {
      const status = b.disabled ? '🔒 Disabled' : '✅ Enabled';
      console.log(`    ${status} "${b.text}"`);
    });
    
    logResult('Button Scan', buttonInfo.length > 0 ? 'pass' : 'fail',
      `Found ${buttonInfo.length} buttons, ${buttonInfo.filter(b => !b.disabled).length} enabled`);
    
    await screenshot(page, '6.1-buttons');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: FORM VALIDATION TEST
  // ═══════════════════════════════════════════════════════════════════════════

  test('7.1 - Test Form Validation on Login', async () => {
    console.log('\n📍 PHASE 7: FORM VALIDATION TEST\n');
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Test empty submission
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check for validation errors
    const validationErrors = await page.locator('.ant-form-item-explain-error, .error, .invalid-feedback, [class*="error"]').all();
    
    const errors: string[] = [];
    for (const error of validationErrors) {
      const text = await error.textContent();
      if (text?.trim()) {
        errors.push(text.trim());
      }
    }
    
    console.log('  Validation errors:', errors);
    
    logResult('Form Validation', errors.length > 0 ? 'pass' : 'fail',
      errors.length > 0 ? `${errors.length} validation errors shown` : 'No validation errors (form may submit without validation)');
    
    await screenshot(page, '7.1-validation');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: RESPONSIVE TEST
  // ═══════════════════════════════════════════════════════════════════════════

  test('8.1 - Mobile Viewport Test', async () => {
    console.log('\n📍 PHASE 8: RESPONSIVE TEST\n');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check for mobile menu (hamburger)
    const mobileMenu = await page.locator('.ant-menu-mobile, .hamburger, [data-testid="mobile-menu"], .menu-toggle, button[aria-label*="menu"]').first().isVisible().catch(() => false);
    
    // Check if content is visible (not cut off)
    const contentVisible = await page.locator('h1, .hero, main, .content').first().isVisible().catch(() => false);
    
    logResult('Mobile Responsive', contentVisible ? 'pass' : 'fail',
      `Mobile menu: ${mobileMenu ? 'Found' : 'Not found'}, Content visible: ${contentVisible}`);
    
    await screenshot(page, '8.1-mobile-view');
    
    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  test('9.1 - Generate Final Report', async () => {
    console.log('\n📍 GENERATING FINAL REPORT\n');
    
    await screenshot(page, '9.1-final-state');
    
    // Test user info for records
    console.log('\n📝 Test User Created:');
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
    console.log(`   Company: ${TEST_USER.companyName}`);
  });
});
