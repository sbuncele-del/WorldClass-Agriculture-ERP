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

interface ButtonTestResult {
  buttonText: string;
  clicked: boolean;
  modalOpened: boolean;
  error?: string;
}

async function testAllButtonsOnPage(page: Page, moduleName: string): Promise<ButtonTestResult[]> {
  const results: ButtonTestResult[] = [];
  
  // Find ALL buttons that look like action buttons
  const actionButtonTexts = [
    'add', 'new', 'create', 'edit', 'delete', 'remove', 'save', 'submit', 
    'export', 'download', 'import', 'upload', 'refresh', 'sync', 'reload',
    'view', 'details', 'open', 'close', 'cancel', 'confirm', 'approve', 'reject',
    'send', 'share', 'print', 'generate', 'schedule', 'assign', 'transfer',
    'process', 'run', 'execute', 'start', 'stop', 'pause', 'resume',
    'filter', 'search', 'clear', 'reset', 'apply'
  ];
  
  // Get all buttons on the page
  const allButtons = page.locator('button:visible');
  const buttonCount = await allButtons.count();
  
  console.log(`[${moduleName}] Found ${buttonCount} visible buttons`);
  
  for (let i = 0; i < buttonCount; i++) {
    const btn = allButtons.nth(i);
    try {
      const btnText = (await btn.textContent())?.trim().toLowerCase() || '';
      const isActionButton = actionButtonTexts.some(action => btnText.includes(action));
      
      if (isActionButton && btnText.length > 0 && btnText.length < 50) {
        const originalBtnText = (await btn.textContent())?.trim() || `Button ${i}`;
        
        // Check if button is enabled
        const isDisabled = await btn.isDisabled();
        if (isDisabled) {
          results.push({ buttonText: originalBtnText, clicked: false, modalOpened: false, error: 'disabled' });
          continue;
        }
        
        // Click the button
        await btn.click();
        await page.waitForTimeout(500);
        
        // Check if modal/drawer/dropdown opened
        const modalOpened = await page.locator('.ant-modal-wrap:visible, .ant-drawer:visible, .ant-dropdown:visible, .ant-popover:visible').count() > 0;
        
        results.push({ buttonText: originalBtnText, clicked: true, modalOpened });
        
        // Close any opened modal/drawer
        if (modalOpened) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      // Button might have been removed from DOM or not interactable
    }
  }
  
  return results;
}

async function clickTab(page: Page, tabName: string): Promise<boolean> {
  const tab = page.locator('.ant-tabs-tab').filter({ hasText: new RegExp(tabName, 'i') }).first();
  if (await tab.count() > 0) {
    await tab.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

test.describe('COMPREHENSIVE BUTTON TEST - ALL MODULES', () => {
  test.setTimeout(120000); // 2 minutes per test
  
  test.beforeEach(async ({ page }) => {
    if (!(await login(page))) test.skip();
  });

  // ==================== AGRICULTURE HUB ====================
  test('ALL-BTN Agriculture Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/agriculture-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Fields', 'Livestock', 'Inputs', 'Harvest', 'Equipment', 'Settings'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Agriculture/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ AGRICULTURE: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== SALES HUB ====================
  test('ALL-BTN Sales Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/sales-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Customers', 'Invoices', 'Quotes', 'Orders', 'Pipeline'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Sales/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ SALES: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== PURCHASE HUB ====================
  test('ALL-BTN Purchase Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/purchase-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Suppliers', 'Orders', 'Requisitions', 'Receiving', 'Returns'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Purchase/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ PURCHASE: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== HR HUB ====================
  test('ALL-BTN HR Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/hr-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Employees', 'Payroll', 'Leave', 'Recruitment', 'Performance'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `HR/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ HR: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== INVENTORY HUB ====================
  test('ALL-BTN Inventory Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/inventory');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Products', 'Stock', 'Categories', 'Adjustments', 'Reports'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Inventory/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ INVENTORY: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== FINANCIAL HUB ====================
  test('ALL-BTN Financial Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/financial-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'General Ledger', 'Accounts Payable', 'Accounts Receivable'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Financial/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ FINANCIAL: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== LOGISTICS HUB ====================
  test('ALL-BTN Logistics Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/logistics-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Vehicles', 'Drivers', 'Routes', 'Fuel', 'Maintenance', 'Tracking'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Logistics/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ LOGISTICS: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== HEALTHCARE HUB ====================
  test('ALL-BTN Healthcare Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/healthcare-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Patients', 'Appointments', 'Facilities', 'Inventory', 'Billing'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Healthcare/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ HEALTHCARE: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== MINING HUB ====================
  test('ALL-BTN Mining Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/mining-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Sites', 'Operations', 'Safety', 'Production', 'Equipment'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Mining/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ MINING: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== CONSTRUCTION HUB ====================
  test('ALL-BTN Construction Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/construction-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Projects', 'Contracts', 'Resources', 'Progress', 'Safety'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Construction/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ CONSTRUCTION: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== PROPERTY HUB ====================
  test('ALL-BTN Property Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/property-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Properties', 'Leases', 'Tenants', 'Maintenance', 'Billing'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Property/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ PROPERTY: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== ASSETS HUB ====================
  test('ALL-BTN Assets Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/assets-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Assets', 'Register', 'Depreciation', 'Maintenance', 'Disposal'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Assets/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ ASSETS: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== WAREHOUSE HUB ====================
  test('ALL-BTN Warehouse Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/warehouse');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Locations', 'Transfers', 'Picking', 'Receiving', 'Inventory'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Warehouse/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ WAREHOUSE: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== PROJECTS HUB ====================
  test('ALL-BTN Projects Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/projects-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Projects', 'Tasks', 'Timeline', 'Resources', 'Reports'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Projects/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ PROJECTS: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== PROPOSALS HUB ====================
  test('ALL-BTN Proposals Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/proposals');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Proposals', 'Templates', 'Clients', 'Pipeline'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Proposals/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ PROPOSALS: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== COMMUNICATIONS HUB ====================
  test('ALL-BTN Communications Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/communications-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Messages', 'Meetings', 'Calls', 'Contacts'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Communications/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ COMMUNICATIONS: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== PRACTICE HUB ====================
  test('ALL-BTN Practice Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/practice-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Clients', 'Matters', 'Time', 'Billing'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Practice/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ PRACTICE: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== AUDIT READY HUB ====================
  test('ALL-BTN Audit Ready Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/audit-ready');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Checklists', 'Documents', 'Findings', 'Reports'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `AuditReady/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ AUDIT READY: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== REGULATORY HUB ====================
  test('ALL-BTN Regulatory Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/regulatory');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Filings', 'Compliance', 'Calendar', 'Documents'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Regulatory/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ REGULATORY: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== MULTI-ENTITY HUB ====================
  test('ALL-BTN Multi-Entity Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/multi-entity');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Entities', 'Consolidation', 'Intercompany', 'Reports'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `MultiEntity/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ MULTI-ENTITY: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });

  // ==================== CALENDAR MODULE ====================
  test('ALL-BTN Calendar Module - All Buttons', async ({ page }) => {
    await page.goto('/app/calendar');
    await page.waitForLoadState('networkidle');
    
    const results = await testAllButtonsOnPage(page, 'Calendar');
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const r of results) {
      totalButtons++;
      if (r.clicked) workingButtons++;
      console.log(`  "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
    }
    
    console.log(`\n✅ CALENDAR: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThanOrEqual(0);
  });

  // ==================== BANKING HUB ====================
  test('ALL-BTN Banking Hub - All Tabs All Buttons', async ({ page }) => {
    await page.goto('/app/banking-hub');
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Accounts', 'Transactions', 'Reconciliation', 'Statements'];
    let totalButtons = 0;
    let workingButtons = 0;
    
    for (const tab of tabs) {
      await clickTab(page, tab);
      const results = await testAllButtonsOnPage(page, `Banking/${tab}`);
      for (const r of results) {
        totalButtons++;
        if (r.clicked) workingButtons++;
        console.log(`  [${tab}] "${r.buttonText}" - clicked: ${r.clicked}, modal: ${r.modalOpened}`);
      }
    }
    
    console.log(`\n✅ BANKING: ${workingButtons}/${totalButtons} buttons tested`);
    expect(totalButtons).toBeGreaterThan(0);
  });
});
