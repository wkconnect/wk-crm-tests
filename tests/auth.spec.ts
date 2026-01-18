import { test, expect } from '@playwright/test';

/**
 * Auth Test Suite
 * 
 * Tests login functionality for WK CRM.
 * Uses credentials from environment variables (GitHub Secrets).
 */

test.describe('Authentication', () => {
  
  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify login page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /W&K Connect|Analytics/i })).toBeVisible();
    
    // Get credentials from environment
    const username = process.env.CRM_USER;
    const password = process.env.CRM_PASS;
    
    if (!username || !password) {
      throw new Error('CRM_USER and CRM_PASS environment variables must be set');
    }
    
    // Fill login form
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    
    // Click login button and wait for navigation away from /login
    // Use Promise.all to ensure we catch the navigation
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 }),
      page.getByRole('button', { name: /войти|sign in|login/i }).click(),
    ]);
    
    // If still on /login, log error details for debugging
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Check for error messages on the page
      const alertText = await page.locator('[role="alert"], .toast, .alert, .error-message').textContent().catch(() => null);
      const formErrors = await page.locator('.field-error, .input-error, [data-error]').allTextContents().catch(() => []);
      
      console.error('Login failed - still on /login page');
      console.error('Current URL:', currentUrl);
      console.error('Alert text:', alertText);
      console.error('Form errors:', formErrors);
      
      throw new Error(`Login failed: still on /login. Alert: ${alertText}, Errors: ${formErrors.join(', ')}`);
    }
    
    // Verify successful login - check for app container/sidebar (stable selector)
    // The app should have a sidebar with W&K Connect branding or navigation
    const appContainer = page.locator('[id="root"]').filter({ 
      has: page.locator('text=/W&K Connect|CRM|Лиды|Контакт-центр/i')
    });
    
    await expect(appContainer).toBeVisible({ timeout: 15000 });
    
    // Additional verification - URL should not be /login
    expect(page.url()).not.toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.locator('#username').fill('invalid@test.com');
    await page.locator('#password').fill('wrongpassword');
    
    // Click login button
    await page.getByRole('button', { name: /войти|sign in|login/i }).click();
    
    // Wait for potential error or redirect
    await page.waitForTimeout(3000);
    
    // Verify still on login page (not redirected)
    const url = page.url();
    expect(url).toContain('/login');
  });
});
