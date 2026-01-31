const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    console.log('1. Loading login page...');
    await page.goto('https://siyabusaerp.co.za/login', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('   Done');
    
    console.log('2. Logging in...');
    await page.type('input[type="email"]', 'admin@worldclass.erp');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    console.log('   URL:', page.url());
    
    console.log('3. Going to Financial Hub...');
    await page.goto('https://siyabusaerp.co.za/app/financial', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const content = await page.content();
    if (content.includes('Something went wrong')) {
      console.log('ERROR: "Something went wrong" displayed!');
      // Get JS errors from page
      const errors = await page.evaluate(() => window.__errors || []);
      console.log('Page errors:', errors);
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
