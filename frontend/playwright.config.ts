import { defineConfig, devices } from '@playwright/test';

/**
 * ============================================================================
 * WORLDCLASS ERP - COMPREHENSIVE PLAYWRIGHT TEST CONFIGURATION
 * ============================================================================
 * 
 * Run modes:
 * - npm run test:e2e              → Tests against local dev server
 * - npm run test:e2e:prod         → Tests against production CloudFront
 * - npm run test:e2e:full         → Full comprehensive test suite
 * 
 * Examples:
 * TEST_URL=https://d1gsy3508vpy61.cloudfront.net npx playwright test
 * npx playwright test e2e/foundation/
 * npx playwright test --ui
 */

const isProduction = !!process.env.TEST_URL;
const baseURL = process.env.TEST_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  
  // Run tests in parallel for faster execution
  fullyParallel: true,
  
  // Fail CI if test.only is left in code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 1,
  
  // Limit workers in CI
  workers: process.env.CI ? 1 : 3,
  
  // Comprehensive reporting
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Output directory for test artifacts
  outputDir: 'test-results',
  
  use: {
    // Base URL for all tests
    baseURL,
    
    // Collect trace for debugging
    trace: 'on',
    
    // Screenshot on every failure
    screenshot: 'on',
    
    // Video on first retry
    video: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Action timeout
    actionTimeout: 15000,
    
    // Viewport size
    viewport: { width: 1920, height: 1080 },
    
    // Locale and timezone
    locale: 'en-ZA',
    timezoneId: 'Africa/Johannesburg',
    
    // Accept downloads
    acceptDownloads: true,
    
    // Extra HTTP headers for API calls
    extraHTTPHeaders: {
      'X-Test-Source': 'playwright-e2e',
    },
  },

  projects: [
    // Desktop Chrome - Primary
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
        },
      },
    },
    
    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Start local dev server before tests (only if not testing production)
  webServer: isProduction ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global timeout - 90 seconds for complex tests
  timeout: 90000,
  
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1,
    },
  },
  
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
});
