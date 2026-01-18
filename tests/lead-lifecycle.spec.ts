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
  
  // Use getByLabel for stable selectors
  await page.getByLabel(/логин|email|username/i).fill(username);
  await page.getByLabel(/пароль|password/i).fill(password);
  
  await page.getByRole('button', { name: /войти|sign in|login/i }).click();
  await page.waitForLoadState('networkidle');
  
  // Wait for authenticated shell (sidebar)
  const shell = page.locator('aside').filter({ hasText: /crm|лиды|контакт/i });
  await expect(shell).toBeVisible({ timeout: 30000 });
}

// Helper: Cleanup - archive/delete test lead
async function cleanupTestLead(page: Page, leadName: string): Promise<void> {
  console.log(`[CLEANUP] Starting cleanup for lead: ${leadName}`);
  
  try {
    // Navigate to leads page
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');
    
    // Try to find the lead card by name
    const leadCard = page.locator(`div:has-text("${leadName}")`).first();
    
    if (await leadCard.isVisible({ timeout: 5000 })) {
      // Click on the lead to open it
      await leadCard.click();
      await page.waitForLoadState('networkidle');
      
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
    
    // Step 2: Navigate directly to lead creation page
    await page.goto('/crm/leads?action=create');
    
    // Step 3: Wait for the create lead modal to appear
    const modal = page.getByRole('dialog', { name: /создать новый лид/i });
    await expect(modal).toBeVisible({ timeout: 15000 });
    
    // Step 4: Fill lead form using getByLabel (stable selectors)
    const titleInput = modal.getByLabel(/название лида/i);
    await titleInput.fill(testLeadName);
    
    // Optional fields - fill if visible
    const emailInput = modal.getByLabel(/email/i);
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill('test@wkconnect.de');
    }
    
    const phoneInput = modal.getByLabel(/телефон|phone/i);
    if (await phoneInput.isVisible({ timeout: 2000 })) {
      await phoneInput.fill('+49 151 00000000');
    }
    
    // Step 5: Submit the form
    await modal.getByRole('button', { name: /создать лид/i }).click();
    
    // Step 6: Wait for modal to close
    await expect(modal).toBeHidden({ timeout: 15000 });
    
    // Step 7: Verify lead was created in the list
    await expect(page.getByText(testLeadName)).toBeVisible({ timeout: 15000 });
    
    console.log(`[TEST] Lead "${testLeadName}" created and verified successfully`);
    
    // Cleanup will run in afterEach
  });
});
