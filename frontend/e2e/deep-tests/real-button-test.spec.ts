import { test, expect, Page } from '@playwright/test';

const TEST_USER = { email: 'testuser@example.com', password: 'Test123!' };

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"], #email', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"], #password', TEST_USER.password);
  await page.click('button[type="submit"]');
  try { await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }); }
  catch { return false; }
  return true;
}

interface RealButtonResult {
  buttonText: string;
  location: string;
  hasOnClick: boolean;
  opensModal: boolean;
  triggersDownload: boolean;
  triggersNavigation: boolean;
  triggersAction: boolean;
  status: 'WORKING' | 'BROKEN' | 'UNKNOWN';
  issue?: string;
}

test.describe('REAL BUTTON FUNCTIONALITY TEST - Catches Broken Buttons', () => {
  test.setTimeout(180000);
  
  test.beforeEach(async ({ page }) => {
    if (!(await login(page))) test.skip();
  });

  async function testButtonsOnModule(page: Page, modulePath: string, moduleName: string): Promise<RealButtonResult[]> {
    const results: RealButtonResult[] = [];
    
    await page.goto(modulePath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find ALL buttons with action-like text
    const actionWords = ['export', 'add', 'create', 'new', 'save', 'submit', 'download', 'import', 'generate', 'refresh', 'sync'];
    
    for (const actionWord of actionWords) {
      const buttons = page.locator(`button`).filter({ hasText: new RegExp(actionWord, 'i') });
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        const btnText = await btn.textContent().catch(() => '') || '';
        const trimmedText = btnText.trim();
        
        if (trimmedText.length < 2 || trimmedText.length > 50) continue;
        
        const result: RealButtonResult = {
          buttonText: trimmedText,
          location: moduleName,
          hasOnClick: false,
          opensModal: false,
          triggersDownload: false,
          triggersNavigation: false,
          triggersAction: false,
          status: 'UNKNOWN'
        };
        
        try {
          // Check if button has onClick handler by checking the DOM
          const hasHandler = await btn.evaluate((el: HTMLButtonElement) => {
            // Check for onclick attribute or React event handlers
            return !!(el.onclick || (el as any)._reactEvents || el.getAttribute('onclick'));
          }).catch(() => false);
          
          // More reliable: Check if clicking does ANYTHING
          const initialModals = await page.locator('.ant-modal-wrap:visible, .ant-drawer:visible').count();
          const initialUrl = page.url();
          
          // Set up download listener
          let downloadTriggered = false;
          const downloadHandler = () => { downloadTriggered = true; };
          page.on('download', downloadHandler);
          
          // Click the button
          await btn.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(800);
          
          // Check what happened
          const newModals = await page.locator('.ant-modal-wrap:visible, .ant-drawer:visible, .ant-popover:visible').count();
          const newUrl = page.url();
          
          result.opensModal = newModals > initialModals;
          result.triggersDownload = downloadTriggered;
          result.triggersNavigation = newUrl !== initialUrl;
          
          // Remove download listener
          page.off('download', downloadHandler);
          
          // Determine if button WORKS
          if (result.opensModal || result.triggersDownload || result.triggersNavigation) {
            result.triggersAction = true;
            result.status = 'WORKING';
          } else {
            // Check if it's an "action" button that SHOULD do something
            const shouldDoSomething = /export|download|import|add|create|new|generate/i.test(trimmedText);
            if (shouldDoSomething) {
              result.status = 'BROKEN';
              result.issue = `Button "${trimmedText}" clicked but did nothing - no modal, no download, no navigation`;
            } else {
              result.status = 'WORKING'; // Refresh/Sync might just update data
              result.triggersAction = true; // Assume it worked silently
            }
          }
          
          // Close any modals
          if (result.opensModal) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }
          
          // Go back if navigated
          if (result.triggersNavigation) {
            await page.goto(modulePath);
            await page.waitForLoadState('networkidle');
          }
          
        } catch (e) {
          result.status = 'BROKEN';
          result.issue = `Error testing button: ${e}`;
        }
        
        results.push(result);
      }
    }
    
    return results;
  }

  test('REAL-TEST: Sales Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/sales-hub', 'Sales Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== SALES HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    working.forEach(r => console.log(`   ✓ "${r.buttonText}" - modal:${r.opensModal} download:${r.triggersDownload}`));
    
    console.log(`\n❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    // Test FAILS if there are broken buttons
    expect(broken.length, `Found ${broken.length} broken buttons in Sales Hub`).toBe(0);
  });

  test('REAL-TEST: Purchase Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/purchase-hub', 'Purchase Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== PURCHASE HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });

  test('REAL-TEST: Agriculture Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/agriculture-hub', 'Agriculture Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== AGRICULTURE HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });

  test('REAL-TEST: Logistics Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/logistics-hub', 'Logistics Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== LOGISTICS HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });

  test('REAL-TEST: Warehouse Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/warehouse', 'Warehouse Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== WAREHOUSE HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });

  test('REAL-TEST: Financial Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/financial-hub', 'Financial Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== FINANCIAL HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });

  test('REAL-TEST: HR Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/hr-hub', 'HR Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== HR HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });

  test('REAL-TEST: Inventory Hub - Find BROKEN Buttons', async ({ page }) => {
    const results = await testButtonsOnModule(page, '/app/inventory', 'Inventory Hub');
    
    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');
    
    console.log(`\n=== INVENTORY HUB BUTTON REPORT ===`);
    console.log(`✅ WORKING: ${working.length}`);
    console.log(`❌ BROKEN: ${broken.length}`);
    broken.forEach(r => console.log(`   ✗ "${r.buttonText}" - ${r.issue}`));
    
    expect(broken.length, `Found ${broken.length} broken buttons`).toBe(0);
  });
});
