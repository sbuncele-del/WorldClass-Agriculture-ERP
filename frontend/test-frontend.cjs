const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    console.log('1. Loading login page...');
    await page.goto('https://siyabusaerp.co.za/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   Done');
    
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'admin@worldclass.erp');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   URL:', page.url());
    
    console.log('3. Going to Financial Hub...');
    await page.goto('https://siyabusaerp.co.za/app/financial', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const errorVisible = await page.locator('text=Something went wrong').isVisible().catch(() => false);
    if (errorVisible) {
      console.log('ERROR: "Something went wrong" displayed!');
    } else {
      console.log('SUCCESS: Page loaded!');
    }
    
    await page.screenshot({ path: 'financial-hub.png', fullPage: true });
    console.log('Screenshot: financial-hub.png');
    
  } catch (error) {
    console.log('ERROR:', error.message);
    await page.screenshot({ path: 'error.png', fullPage: true });
  }
  
  await browser.close();
})();
