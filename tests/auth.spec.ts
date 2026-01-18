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
    
    // Wait for navigation to dashboard
    await page.waitForURL(/\/(crm|dashboard|contact-center)/, { timeout: 30000 });
    
    // Verify successful login - check for menu elements
    await expect(page.getByRole('link', { name: /лиды/i }).or(
      page.getByRole('button', { name: /CRM/i })
    )).toBeVisible({ timeout: 15000 });
    
    // Additional verification - user profile should be visible
    await expect(page.locator('button[hint*="User"], button[hint*="Admin"]').first()).toBeVisible();
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
