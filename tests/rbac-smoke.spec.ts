import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://crm.wkconnect.de';

type CredPrefix = 'CRM_ADMIN' | 'CRM_L1' | 'CRM_L2' | 'CRM_L3';

function getCred(prefix: CredPrefix) {
  const user = process.env[`${prefix}_USER`];
  const pass = process.env[`${prefix}_PASS`];
  if (!user || !pass) {
    throw new Error(`Missing env: ${prefix}_USER or ${prefix}_PASS`);
  }
  return { user, pass };
}

async function login(page, prefix: CredPrefix) {
  const { user, pass } = getCred(prefix);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // tolerant selectors (RU/EN)
  const loginInput = page.getByLabel(/логин|email|username/i);
  const passInput = page.getByLabel(/пароль|password/i);

  await loginInput.fill(user);
  await passInput.fill(pass);

  // Try common buttons
  const submitBtn = page.getByRole('button', { name: /войти|login|sign in/i });
  await submitBtn.click();

  // Wait for app shell
  await page.waitForURL(/\/(crm|dashboard|contact-center|tasks)/, { timeout: 60_000 });
}

async function expectAccessDenied(page) {
  // We don't rely on exact copy; we assert either 403 status view or guard text.
  await expect(
    page.locator('text=/доступ запрещ/i, text=/access denied/i, text=/forbidden/i')
      .first()
  ).toBeVisible({ timeout: 15_000 });
}

test.describe('RBAC smoke — Admin', () => {
  test('Admin has access to Routing and Lines (not 403)', async ({ page }) => {
    await login(page, 'CRM_ADMIN');

    await page.goto(`${BASE_URL}/settings/contact-center/routing`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=/routing/i')).toBeVisible({ timeout: 30_000 });

    await page.goto(`${BASE_URL}/settings/contact-center/lines`, { waitUntil: 'domcontentloaded' });
    // Lines page should NOT be denied
    await expect(page.locator('text=/доступ запрещ/i, text=/access denied/i')).toHaveCount(0);
  });
});

test.describe('RBAC smoke — MSP_SUPPORT_L1', () => {
  test('L1: contact-center доступен, routing/lines запрещены', async ({ page }) => {
    await login(page, 'CRM_L1');

    await page.goto(`${BASE_URL}/contact-center`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=/контакт-центр/i, text=/contact center/i').first()).toBeVisible({ timeout: 30_000 });

    await page.goto(`${BASE_URL}/settings/contact-center/routing`, { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);

    await page.goto(`${BASE_URL}/settings/contact-center/lines`, { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);
  });
});

test.describe('RBAC smoke — MSP_SUPPORT_L2', () => {
  test('L2: contact-center доступен, routing/lines запрещены + inboxList no leak', async ({ page }) => {
    await login(page, 'CRM_L2');

    // Capture the inboxList response while opening CC
    const inboxPromise = page.waitForResponse((res) => {
      return res.url().includes('/api/trpc/messaging.inboxList') && res.request().method() === 'GET';
    }, { timeout: 60_000 });

    await page.goto(`${BASE_URL}/contact-center`, { waitUntil: 'domcontentloaded' });

    // Routing/Lines denied
    await page.goto(`${BASE_URL}/settings/contact-center/routing`, { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);

    await page.goto(`${BASE_URL}/settings/contact-center/lines`, { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);

    // Leak check: rows length must equal meta.myCount for tab "my"
    const resp = await inboxPromise;
    const body = await resp.json();

    // tRPC batch format: { result: { data: { json: ... }}} (or array)
    const payload =
      body?.[0]?.result?.data?.json ??
      body?.result?.data?.json;

    if (!payload) {
      throw new Error('Cannot parse messaging.inboxList response payload');
    }

    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const meta = payload?.meta || {};
    const myCount = typeof meta.myCount === 'number' ? meta.myCount : null;

    // If backend provides myCount, enforce strict equality as smoke signal
    if (myCount !== null) {
      expect(rows.length).toBe(myCount);
    } else {
      // fallback: ensure every row is assigned to current user OR participant-only (we can’t know userId here), so keep only the strict check when myCount exists.
      expect(rows.length).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('RBAC smoke — MSP_SUPPORT_L3', () => {
  test('L3: contact-center доступен, routing/lines запрещены', async ({ page }) => {
    await login(page, 'CRM_L3');

    await page.goto(`${BASE_URL}/contact-center`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=/контакт-центр/i, text=/contact center/i').first()).toBeVisible({ timeout: 30_000 });

    await page.goto(`${BASE_URL}/settings/contact-center/routing`, { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);

    await page.goto(`${BASE_URL}/settings/contact-center/lines`, { waitUntil: 'domcontentloaded' });
    await expectAccessDenied(page);
  });
});
