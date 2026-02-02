import { test, expect, Page } from '@playwright/test';

/**
 * Smoke Test Suite for PROD
 * 
 * Quick health check for critical pages:
 * - Login
 * - Contact Center
 * - CRM Leads
 * - Tasks
 * 
 * This test does NOT create any data (read-only).
 */

// Helper: Login to CRM
async function login(page: Page): Promise<void> {
  const username = process.env.CRM_USER;
  const password = process.env.CRM_PASS;
  
  if (!username || !password) {
    throw new Error('CRM_USER and CRM_PASS environment variables must be set');
  }
  
  await page.goto('/login');
  
  // Fill login form using getByLabel
  await page.getByLabel(/логин|email|username/i).fill(username);
  await page.getByLabel(/пароль|password/i).fill(password);
  
  // Click login button
  await page.getByRole('button', { name: /войти/i }).click();
  
  // Wait for shell to appear (strict selector)
  const shell = page.locator('aside:visible').first();
  await expect(shell).toBeVisible({ timeout: 30000 });
}

test.describe('Smoke PROD', () => {
  
  test('should login and verify shell is visible', async ({ page }) => {
    await login(page);
    
    // Verify we're logged in
    const shell = page.locator('aside:visible').first();
    await expect(shell).toBeVisible();
    
    console.log('[SMOKE] Login successful');
  });

  test('should load Contact Center page', async ({ page }) => {
    await login(page);
    
    // Navigate to Contact Center
    await page.goto('/contact-center');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded - check for tabs or main content
    const pageContent = page.locator('main, [role="main"], .content').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
    
    // Check for Contact Center specific elements
    const tabs = page.locator('button[role="tab"], [data-state]').first();
    await expect(tabs).toBeVisible({ timeout: 10000 });
    
    console.log('[SMOKE] Contact Center loaded');
  });

  test('should load CRM Leads page', async ({ page }) => {
    await login(page);
    
    // Navigate to Leads
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    const pageContent = page.locator('main, [role="main"], .content').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
    
    // Check for leads-specific elements (table, list, or "New Lead" button)
    const leadsIndicator = page.getByRole('button', { name: /новый лид|new lead/i })
      .or(page.locator('table, [role="table"], [data-testid*="lead"]').first());
    await expect(leadsIndicator).toBeVisible({ timeout: 10000 });
    
    console.log('[SMOKE] CRM Leads loaded');
  });

  test('should load Tasks page', async ({ page }) => {
    await login(page);
    
    // Navigate to Tasks
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    const pageContent = page.locator('main, [role="main"], .content').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
    
    console.log('[SMOKE] Tasks loaded');
  });
});
