/**
 * Test Helpers & Utilities
 * Reusable functions for all E2E tests
 */

import { Page, expect, Locator } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

const BASE_URL = (process.env.TEST_URL || '').replace(/\/$/, '');

const authCache: {
  token?: string;
  refreshToken?: string;
  user?: any;
  tenant?: any;
} = {};

let loginPromise: Promise<boolean> | null = null;

async function setAuthState(page: Page, state: typeof authCache): Promise<void> {
  const { token, refreshToken, user, tenant } = state;
  if (!token) return;

  await page.goto(BASE_URL || '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, refreshToken, user, tenant }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    if (tenant) {
      localStorage.setItem('tenant', JSON.stringify(tenant));
      if (tenant.id) {
        localStorage.setItem('tenantId', tenant.id);
        localStorage.setItem('workspaceId', tenant.id);
      }
    }
  }, { token, refreshToken, user, tenant });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function loginAsDemo(page: Page, role: 'admin' | 'user' = 'admin'): Promise<boolean> {
  const creds = TEST_CONFIG.demoCredentials[role];
  return login(page, creds.email, creds.password);
}

async function apiLogin(page: Page, email: string, password: string): Promise<boolean> {
  if (authCache.token) {
    await setAuthState(page, authCache);
    return true;
  }

  if (loginPromise) {
    return loginPromise;
  }

  const endpoint = `${BASE_URL || ''}/api/auth/login`;
  const attempts = [0, 1000, 3000, 5000]; // basic backoff for 429s

  loginPromise = (async () => {
    for (let i = 0; i < attempts.length; i++) {
      if (attempts[i]) {
        await page.waitForTimeout(attempts[i]);
      }

      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Source': 'playwright-e2e',
          },
          body: JSON.stringify({ email, password }),
        });

        if (resp.ok) {
          const data = await resp.json();
          authCache.token = data?.data?.tokens?.accessToken || data?.token;
          authCache.refreshToken = data?.data?.tokens?.refreshToken || data?.refreshToken;
          authCache.user = data?.data?.user || data?.user;
          authCache.tenant = data?.data?.tenant || data?.workspace;

          if (!authCache.token) return false;

          await setAuthState(page, authCache);
          return true;
        }

        const status = resp.status;
        if (![429, 500, 503].includes(status)) return false;
      } catch (e) {
        console.error('API login attempt failed', e);
      }
    }

    return false;
  })();

  try {
    return await loginPromise;
  } finally {
    loginPromise = null;
  }
}

export async function login(page: Page, email: string, password: string): Promise<boolean> {
  // Try API login first to avoid UI flakiness and rate limiting
  const apiLoggedIn = await apiLogin(page, email, password);
  if (apiLoggedIn) {
    await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {});
    if (page.url().includes('/login')) {
      await page.goto('/app', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    await page.waitForTimeout(1500);
    const dashboardVisible = await page.locator('[data-testid="dashboard"], .dashboard, text=Dashboard, nav, .ant-menu, .app-shell').first().isVisible().catch(() => false);
    if (dashboardVisible || page.url().includes('/app/')) {
      return true;
    }
    await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1000);
    return page.url().includes('/app/');
  }

  // Fallback to UI login
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first().click();
  await page.waitForTimeout(3000);

  const dashboardVisible = await page.locator('[data-testid="dashboard"], .dashboard, text=Dashboard').first().isVisible().catch(() => false);
  return dashboardVisible || !page.url().includes('/login');
}

export async function logout(page: Page): Promise<void> {
  // Try to find and click logout
  const userMenu = page.locator('.ant-avatar, .user-menu, [data-testid="user-menu"]').first();
  if (await userMenu.isVisible().catch(() => false)) {
    await userMenu.click();
    await page.waitForTimeout(500);
  }
  
  const logoutBtn = page.locator('text=Logout, text=Sign out, a[href*="logout"]').first();
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
  } else {
    await page.goto('/logout');
  }
  
  await page.waitForTimeout(1000);
}

export async function signup(page: Page, data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}): Promise<boolean> {
  await page.goto('/signup', { waitUntil: 'networkidle' });
  
  // Step 1: Account
  await page.fill('input[name="email"], #email', data.email);
  await page.fill('input[name="password"], #password', data.password);
  await page.fill('input[name="confirmPassword"], #confirmPassword', data.password);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(1000);
  
  // Step 2: Profile
  await page.fill('input[name="firstName"], #firstName', data.firstName);
  await page.fill('input[name="lastName"], #lastName', data.lastName);
  await page.fill('input[name="companyName"], #companyName', data.companyName);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(1000);
  
  // Step 3: Plan - select starter and submit
  await page.locator('input[value="starter"]').check();
  await page.locator('button:has-text("Create Account")').click();
  
  await page.waitForTimeout(3000);
  return !page.url().includes('/signup');
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function navigateTo(page: Page, path: string): Promise<void> {
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  await page.goto(fullPath, { waitUntil: 'networkidle', timeout: TEST_CONFIG.timeouts.long });
}

export async function navigateToModule(page: Page, module: string): Promise<boolean> {
  const modulePaths: Record<string, string> = {
    dashboard: '/app/dashboard',
    sales: '/app/sales',
    inventory: '/app/inventory',
    purchasing: '/app/purchasing',
    financial: '/app/financial',
    hr: '/app/hr',
    manufacturing: '/app/manufacturing',
    warehouse: '/app/warehouse',
    projects: '/app/projects',
    assets: '/app/assets',
    admin: '/app/admin',
    compliance: '/app/compliance',
    communications: '/app/communications',
    logistics: '/app/logistics',
    healthcare: '/app/healthcare',
    mining: '/app/mining',
    agriculture: '/app/agriculture',
    property: '/app/property',
    practice: '/app/practice',
  };
  
  const path = modulePaths[module.toLowerCase()] || `/app/${module}`;
  await navigateTo(page, path);
  
  // Check if redirected to login
  return !page.url().includes('/login');
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON INTERACTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export interface ButtonTestResult {
  found: boolean;
  visible: boolean;
  enabled: boolean;
  clicked: boolean;
  error?: string;
}

export async function testButton(page: Page, selector: string | string[], options?: {
  click?: boolean;
  waitForNavigation?: boolean;
  waitForModal?: boolean;
  screenshot?: string;
}): Promise<ButtonTestResult> {
  const selectors = Array.isArray(selector) ? selector : [selector];
  const result: ButtonTestResult = { found: false, visible: false, enabled: false, clicked: false };
  
  for (const sel of selectors) {
    try {
      const button = page.locator(sel).first();
      result.found = await button.count() > 0;
      
      if (result.found) {
        result.visible = await button.isVisible().catch(() => false);
        result.enabled = await button.isEnabled().catch(() => false);
        
        if (options?.click && result.visible && result.enabled) {
          if (options.waitForNavigation) {
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle', timeout: TEST_CONFIG.timeouts.medium }).catch(() => {}),
              button.click(),
            ]);
          } else {
            await button.click();
          }
          
          if (options.waitForModal) {
            await page.waitForSelector('.ant-modal, .modal, [role="dialog"]', { timeout: 5000 }).catch(() => {});
          }
          
          result.clicked = true;
        }
        
        break;
      }
    } catch (e) {
      result.error = (e as Error).message;
    }
  }
  
  if (options?.screenshot) {
    await page.screenshot({ path: `test-results/screenshots/${options.screenshot}.png`, fullPage: true });
  }
  
  return result;
}

export async function findAndClickButton(page: Page, textOrSelectors: string | string[]): Promise<boolean> {
  const items = Array.isArray(textOrSelectors) ? textOrSelectors : [textOrSelectors];
  
  for (const item of items) {
    // Try as text first
    const byText = page.locator(`button:has-text("${item}"), a:has-text("${item}")`).first();
    if (await byText.isVisible().catch(() => false)) {
      await byText.click();
      return true;
    }
    
    // Try as selector
    const bySelector = page.locator(item).first();
    if (await bySelector.isVisible().catch(() => false)) {
      await bySelector.click();
      return true;
    }
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'date' | 'textarea';
  selector?: string;
  value: string | number | boolean;
}

export async function fillForm(page: Page, fields: FormField[]): Promise<{ filled: string[]; failed: string[] }> {
  const filled: string[] = [];
  const failed: string[] = [];
  
  for (const field of fields) {
    try {
      const selectors = field.selector ? [field.selector] : [
        `input[name="${field.name}"]`,
        `#${field.name}`,
        `[data-testid="${field.name}"]`,
        `textarea[name="${field.name}"]`,
        `select[name="${field.name}"]`,
      ];
      
      let success = false;
      for (const sel of selectors) {
        const element = page.locator(sel).first();
        if (await element.isVisible().catch(() => false)) {
          switch (field.type) {
            case 'select':
              await element.selectOption(String(field.value));
              break;
            case 'checkbox':
            case 'radio':
              if (field.value) {
                await element.check();
              } else {
                await element.uncheck();
              }
              break;
            default:
              await element.fill(String(field.value));
          }
          success = true;
          break;
        }
      }
      
      if (success) {
        filled.push(field.name);
      } else {
        failed.push(field.name);
      }
    } catch (e) {
      failed.push(field.name);
    }
  }
  
  return { filled, failed };
}

export async function submitForm(page: Page): Promise<{ success: boolean; message?: string }> {
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Save")',
    'button:has-text("Submit")',
    'button:has-text("Create")',
    'button:has-text("Add")',
    '.ant-btn-primary',
  ];
  
  for (const sel of submitSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2000);
      
      // Check for success message
      const successMsg = await page.locator('.ant-message-success, .success, .alert-success').first().textContent().catch(() => null);
      if (successMsg) {
        return { success: true, message: successMsg };
      }
      
      // Check for error message
      const errorMsg = await page.locator('.ant-message-error, .error, .alert-error').first().textContent().catch(() => null);
      if (errorMsg) {
        return { success: false, message: errorMsg };
      }
      
      return { success: true };
    }
  }
  
  return { success: false, message: 'Submit button not found' };
}

// ═══════════════════════════════════════════════════════════════════════════
// TABLE & DATA HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function getTableRowCount(page: Page): Promise<number> {
  const rows = await page.locator('table tbody tr, .ant-table-row').count();
  return rows;
}

export async function findTableRow(page: Page, searchText: string): Promise<Locator | null> {
  const rows = page.locator('table tbody tr, .ant-table-row');
  const count = await rows.count();
  
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = await row.textContent();
    if (text?.includes(searchText)) {
      return row;
    }
  }
  
  return null;
}

export async function clickTableAction(page: Page, rowText: string, action: string): Promise<boolean> {
  const row = await findTableRow(page, rowText);
  if (!row) return false;
  
  const actionBtn = row.locator(`button:has-text("${action}"), a:has-text("${action}"), .anticon-${action.toLowerCase()}`).first();
  if (await actionBtn.isVisible().catch(() => false)) {
    await actionBtn.click();
    return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function waitForModal(page: Page, timeout: number = 5000): Promise<boolean> {
  try {
    await page.waitForSelector('.ant-modal, .modal, [role="dialog"]', { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function closeModal(page: Page): Promise<void> {
  const closeBtn = page.locator('.ant-modal-close, .modal-close, button:has-text("Cancel"), button:has-text("Close")').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }
}

export async function confirmModal(page: Page): Promise<void> {
  const confirmBtn = page.locator('.ant-modal-footer .ant-btn-primary, .modal-footer .btn-primary, button:has-text("OK"), button:has-text("Confirm")').first();
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function checkValidationError(page: Page, fieldName?: string): Promise<string | null> {
  const selectors = fieldName 
    ? [`.ant-form-item-explain-error:near([name="${fieldName}"])`, `#${fieldName}_help`, `.error-${fieldName}`]
    : ['.ant-form-item-explain-error', '.error-message', '.invalid-feedback', '[role="alert"]'];
  
  for (const sel of selectors) {
    const error = page.locator(sel).first();
    if (await error.isVisible().catch(() => false)) {
      return await error.textContent();
    }
  }
  
  return null;
}

export async function expectNoErrors(page: Page): Promise<void> {
  const errors = await page.locator('.ant-message-error, .error-message, .ant-form-item-explain-error').count();
  expect(errors).toBe(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREENSHOT & REPORTING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function screenshot(page: Page, name: string, fullPage: boolean = true): Promise<void> {
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
  await page.screenshot({ 
    path: `test-results/screenshots/${safeName}.png`, 
    fullPage 
  });
}

export function logStep(step: string, status: 'start' | 'pass' | 'fail' | 'skip' = 'start'): void {
  const icons = { start: '📍', pass: '✅', fail: '❌', skip: '⏭️' };
  console.log(`${icons[status]} ${step}`);
}

export function logSection(title: string): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📋 ${title}`);
  console.log(`${'═'.repeat(70)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  token?: string;
}

/**
 * Make an API request using Playwright's request context or native fetch
 * 
 * Usage:
 *   // With Playwright request context
 *   await apiRequest(request, '/api/health');
 *   await apiRequest(request, '/api/auth/signup', { method: 'POST', data: { ... } });
 *   
 *   // Without request context (uses fetch)
 *   await apiRequest('/api/health');
 */
export async function apiRequest(
  requestOrEndpoint: any, // APIRequestContext or endpoint string
  endpointOrOptions?: string | ApiRequestOptions,
  options?: ApiRequestOptions
): Promise<{ status: number; data: any }> {
  let endpoint: string;
  let method: string = 'GET';
  let data: any;
  let token: string | undefined;
  let usePlaywright = false;
  let playwrightRequest: any;
  
  // Parse arguments
  if (typeof requestOrEndpoint === 'string') {
    // Called as: apiRequest('/api/health') or apiRequest('/api/health', { method: 'POST' })
    endpoint = requestOrEndpoint;
    if (endpointOrOptions && typeof endpointOrOptions === 'object') {
      const opts = endpointOrOptions as ApiRequestOptions;
      method = opts.method || 'GET';
      data = opts.data;
      token = opts.token;
    }
  } else {
    // Called as: apiRequest(request, '/api/health') or apiRequest(request, '/api/health', { method: 'POST' })
    usePlaywright = true;
    playwrightRequest = requestOrEndpoint;
    endpoint = endpointOrOptions as string;
    if (options) {
      method = options.method || 'GET';
      data = options.data;
      token = options.token;
    }
  }
  
  const url = `${TEST_CONFIG.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    if (usePlaywright && playwrightRequest) {
      // Use Playwright's request context
      const response = await playwrightRequest.fetch(url, {
        method,
        headers,
        data: data ? data : undefined,
      });
      const responseData = await response.json().catch(() => ({}));
      return { status: response.status(), data: responseData };
    } else {
      // Use native fetch
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      const responseData = await response.json().catch(() => ({}));
      return { status: response.status, data: responseData };
    }
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    return { status: 0, data: { error: String(error) } };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WAIT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function waitForLoadingToFinish(page: Page, timeout: number = 10000): Promise<void> {
  const loadingSelectors = ['.ant-spin', '.loading', '.spinner', '[data-loading="true"]'];
  
  for (const sel of loadingSelectors) {
    try {
      await page.waitForSelector(sel, { state: 'hidden', timeout });
    } catch {
      // Loading indicator might not exist
    }
  }
}

export async function waitForToast(page: Page, type: 'success' | 'error' | 'info' = 'success', timeout: number = 5000): Promise<string | null> {
  const selectors = {
    success: '.ant-message-success, .toast-success, .alert-success',
    error: '.ant-message-error, .toast-error, .alert-error',
    info: '.ant-message-info, .toast-info, .alert-info',
  };
  
  try {
    const toast = page.locator(selectors[type]).first();
    await toast.waitFor({ timeout });
    return await toast.textContent();
  } catch {
    return null;
  }
}

export default {
  login,
  loginAsDemo,
  logout,
  signup,
  navigateTo,
  navigateToModule,
  testButton,
  findAndClickButton,
  fillForm,
  submitForm,
  getTableRowCount,
  findTableRow,
  clickTableAction,
  waitForModal,
  closeModal,
  confirmModal,
  checkValidationError,
  expectNoErrors,
  screenshot,
  logStep,
  logSection,
  apiRequest,
  waitForLoadingToFinish,
  waitForToast,
};
