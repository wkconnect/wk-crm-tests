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
    
    // Fill login form using getByLabel for stability
    await page.getByLabel(/логин|email/i).fill(username);
    await page.getByLabel(/пароль|password/i).fill(password);
    
    // Click login button
    await page.getByRole('button', { name: /войти|sign in|login/i }).click();
    
    // Wait for network to settle
    await page.waitForLoadState('networkidle');
    
    // Wait for authenticated shell (sidebar with CRM/Лиды/Контакт-центр)
    // This is the stable "logged-in" signal based on UI/app-shell
    const shell = page.locator('aside').filter({ hasText: /crm|лиды|контакт/i });
    
    try {
      await expect(shell).toBeVisible({ timeout: 30000 });
    } catch (error) {
      // If shell not visible, log errors for debugging
      console.error('[AUTH] Shell not visible after login attempt');
      
      // Check for error messages
      const alertText = await page.locator('[role="alert"], .toast, .alert, .error-message').textContent().catch(() => null);
      console.error('[AUTH] Alert text:', alertText);
      
      // Log form errors
      const formErrors = await page.locator('.field-error, .input-error, [data-error]').allTextContents().catch(() => []);
      console.error('[AUTH] Form errors:', formErrors);
      
      // Log current URL
      console.error('[AUTH] Current URL:', page.url());
      
      // Log small slice of page content around form
      const bodySnippet = await page.locator('form').innerHTML().catch(() => 'Form not found');
      console.error('[AUTH] Form HTML snippet:', bodySnippet.substring(0, 500));
      
      throw error;
    }
    
    // Hard-proof: navigate to protected route and ensure not redirected back to /login
    await page.goto('/crm/leads');
    await expect(page).not.toHaveURL(/\/login/i);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill with invalid credentials using getByLabel
    await page.getByLabel(/логин|email/i).fill('invalid@test.com');
    await page.getByLabel(/пароль|password/i).fill('wrongpassword');
    
    // Click login button
    await page.getByRole('button', { name: /войти|sign in|login/i }).click();
    
    // Wait for potential error or redirect
    await page.waitForTimeout(3000);
    
    // Verify still on login page (not redirected)
    const url = page.url();
    expect(url).toContain('/login');
  });
});
