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
    
    // Click login button
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Wait for navigation away from login page
    await page.waitForURL(/\/(crm|dashboard|contact-center)/, { timeout: 30000 });
    
    // Verify successful login - check URL is NOT /login and contains expected route
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).toMatch(/\/(crm|dashboard|contact-center)/);
    
    // Additional verification - check for logged-in state using stable selector
    // Use sequential checks instead of .or() to avoid strict mode violation
    const leadsLink = page.getByRole('link', { name: /лиды/i });
    const crmBtn = page.getByRole('button', { name: /^CRM$/i });
    
    const leadsCount = await leadsLink.count();
    if (leadsCount > 0) {
      await expect(leadsLink.first()).toBeVisible({ timeout: 15000 });
    } else {
      await expect(crmBtn.first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.locator('#username').fill('invalid@test.com');
    await page.locator('#password').fill('wrongpassword');
    
    // Click login button
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Should stay on login page or show error
    await page.waitForTimeout(3000);
    
    // Verify still on login page (not redirected)
    const url = page.url();
    expect(url).toContain('/login');
  });
});
