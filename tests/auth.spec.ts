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
    
    // Fill login form using getByLabel
    await page.getByLabel(/логин|email|username/i).fill(username);
    await page.getByLabel(/пароль|password/i).fill(password);
    
    // Click login button
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Wait for shell to appear (strict selector)
    const shell = page.locator('aside:visible').first();
    await expect(shell).toBeVisible({ timeout: 30000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill with invalid credentials using getByLabel
    await page.getByLabel(/логин|email|username/i).fill('invalid@test.com');
    await page.getByLabel(/пароль|password/i).fill('wrongpassword');
    
    // Click login button
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Should stay on login page or show error
    await page.waitForTimeout(3000);
    
    // Verify still on login page (not redirected)
    const url = page.url();
    expect(url).toContain('/login');
  });
});
