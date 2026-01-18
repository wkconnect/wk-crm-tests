import { defineConfig, devices } from '@playwright/test';

/**
 * WK CRM E2E Tests - Playwright Configuration
 * 
 * PROD-SAFE SETTINGS:
 * - workers: 1 (no parallel load on PROD)
 * - fullyParallel: false
 * - trace: on-first-retry (for debugging failures)
 * - video/screenshot: only on failure
 */
export default defineConfig({
  testDir: './tests',
  
  /* PROD-safe: Run tests sequentially */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  
  /* PROD-safe: Single worker to avoid load */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for all tests */
    baseURL: 'https://crm.wkconnect.de',
    
    /* CRITICAL: Trace on first retry for debugging */
    trace: 'on-first-retry',
    
    /* Video only on failure */
    video: 'retain-on-failure',
    
    /* Screenshot only on failure */
    screenshot: 'only-on-failure',
    
    /* Reasonable timeout for PROD */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Global timeout */
  timeout: 60000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
