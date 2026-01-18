import { test, expect, Page } from '@playwright/test';

/**
 * Lead Lifecycle Test Suite
 * 
 * PROD-SAFE RULES:
 * - All created leads MUST have TEST_ prefix
 * - Cleanup MUST run even if test fails (finally block)
 * - No real PII - only synthetic data
 */

// Helper: Generate unique test lead name
function generateTestLeadName(): string {
  const timestamp = Date.now();
  return `TEST_Lead_${timestamp}`;
}

// Helper: Login to CRM
async function login(page: Page): Promise<void> {
  const username = process.env.CRM_USER;
  const password = process.env.CRM_PASS;
  
  if (!username || !password) {
    throw new Error('CRM_USER and CRM_PASS environment variables must be set');
  }
  
  await page.goto('/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /войти/i }).click();
  await page.waitForURL(/\/(crm|dashboard|contact-center)/, { timeout: 30000 });
}

// Helper: Cleanup - archive/delete test lead
async function cleanupTestLead(page: Page, leadName: string): Promise<void> {
  console.log(`[CLEANUP] Starting cleanup for lead: ${leadName}`);
  
  try {
    // Navigate to leads page
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');
    
    // Search for the test lead
    const filterButton = page.getByRole('button', { name: /фильтры/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }
    
    // Try to find the lead card by name
    const leadCard = page.locator(`div:has-text("${leadName}")`).first();
    
    if (await leadCard.isVisible({ timeout: 5000 })) {
      // Click on the lead to open it
      await leadCard.click();
      await page.waitForLoadState('networkidle');
      
      // Look for delete/archive option
      // Try menu button (three dots)
      const menuButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
      
      // Try to find and click Archive or Delete
      const archiveButton = page.getByRole('button', { name: /архив|archive/i });
      const deleteButton = page.getByRole('button', { name: /удалить|delete/i });
      
      if (await archiveButton.isVisible({ timeout: 2000 })) {
        await archiveButton.click();
        console.log(`[CLEANUP] Lead "${leadName}" archived`);
      } else if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        // Confirm deletion if dialog appears
        const confirmButton = page.getByRole('button', { name: /подтвердить|confirm|да|yes/i });
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }
        console.log(`[CLEANUP] Lead "${leadName}" deleted`);
      } else {
        // Fallback: Change status to "Потеряны" (Lost)
        const editButton = page.getByRole('button', { name: /редактировать/i });
        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForTimeout(500);
          
          // Find status dropdown and change to Lost
          const statusDropdown = page.locator('#status, [id*="status"]');
          if (await statusDropdown.isVisible()) {
            await statusDropdown.click();
            const lostOption = page.getByRole('option', { name: /потерян|lost/i });
            if (await lostOption.isVisible({ timeout: 2000 })) {
              await lostOption.click();
              // Save changes
              const saveButton = page.getByRole('button', { name: /сохранить|save/i });
              if (await saveButton.isVisible()) {
                await saveButton.click();
              }
              console.log(`[CLEANUP] Lead "${leadName}" marked as Lost`);
            }
          }
        }
      }
    } else {
      console.log(`[CLEANUP] Lead "${leadName}" not found - may have been already cleaned up`);
    }
  } catch (error) {
    console.error(`[CLEANUP] Error during cleanup: ${error}`);
    // Don't throw - cleanup should not fail the test
  }
}

test.describe('Lead Lifecycle', () => {
  let testLeadName: string;
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    testLeadName = generateTestLeadName();
  });

  test.afterEach(async () => {
    // CRITICAL: Always cleanup, even if test failed
    if (testLeadName) {
      await cleanupTestLead(page, testLeadName);
    }
  });

  test('should create, verify, and cleanup a test lead', async ({ page }) => {
    // Step 1: Login
    await login(page);
    
    // Step 2: Navigate to leads page
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Click "New Lead" button
    await page.getByRole('button', { name: /новый лид/i }).click();
    
    // Step 4: Fill lead form with TEST_ prefix
    await page.locator('#title').fill(testLeadName);
    await page.locator('#email').fill('test@wkconnect.de');
    await page.locator('#phone').fill('+49 151 00000000');
    
    // Set value to 0 (test lead)
    const valueInput = page.locator('#value');
    if (await valueInput.isVisible()) {
      await valueInput.fill('0');
    }
    
    // Step 5: Submit the form
    await page.getByRole('button', { name: /создать лид/i }).click();
    
    // Step 6: Verify lead was created
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to leads list to verify
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');
    
    // Search for our test lead
    const leadExists = await page.locator(`text=${testLeadName}`).isVisible({ timeout: 10000 });
    expect(leadExists).toBe(true);
    
    console.log(`[TEST] Lead "${testLeadName}" created and verified successfully`);
    
    // Cleanup will run in afterEach
  });
});
