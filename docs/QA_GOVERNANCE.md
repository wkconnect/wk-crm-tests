# QA Governance — WK CRM Tests

This document defines the quality assurance governance rules for the `wk-crm-tests` repository.

## Golden Rule

> **Merge only when CI is green.**
>
> No exceptions. If CI is red, analyze the trace, fix selectors, and create a new commit.

## Safety Protocols

### Test Data Prefix

All test-created entities **MUST** use the `TEST_` prefix:

```typescript
const testLeadName = `TEST_Lead_${Date.now()}`;
```

### Cleanup Requirements

Every test **MUST** clean up after itself, even on failure:

```typescript
test.afterEach(async () => {
  if (testLeadName) {
    await cleanupTestLead(page, testLeadName);
  }
});
```

### No PII

Only synthetic data is allowed:

| Field | Allowed Value |
|-------|---------------|
| Email | `test@wkconnect.de` |
| Phone | `+49 151 00000000` |
| Name | `TEST_*` prefix |

### Parallelization

Tests **MUST** run sequentially to avoid race conditions on PROD:

```typescript
// playwright.config.ts
workers: 1,
fullyParallel: false,
```

## Selector Policy

### Priority Order

1. `getByRole()` — semantic, accessible
2. `getByLabel()` — form fields
3. `data-testid` / `data-*` attributes
4. CSS selectors (last resort)

### Forbidden Patterns

| Pattern | Why |
|---------|-----|
| `#id` | Fragile, may change |
| `.class` | Fragile, may change |
| `filter({ hasText })` on generic elements | Strict mode violation |
| `page.locator('div').first()` | Too generic |

### Recommended Patterns

```typescript
// Good: semantic selectors
await page.getByRole('button', { name: /войти/i }).click();
await page.getByLabel(/название лида/i).fill(name);

// Good: strict shell selector
const shell = page.locator('aside:visible').first();
await expect(shell).toBeVisible({ timeout: 30000 });

// Good: modal scoping
const modal = page.getByRole('dialog');
await modal.getByLabel(/email/i).fill('test@wkconnect.de');
```

## Evidence Requirements

### On Success

- CI green badge
- Test duration logged
- No artifacts needed

### On Failure

- Trace file uploaded
- Video recording (if enabled)
- Screenshot of failure state
- Error message documented in PR

### Artifact Configuration

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
}
```

## What To Do When CI Is Red

1. **Download trace** from GitHub Actions artifacts
2. **Open trace** in Playwright Trace Viewer: `npx playwright show-trace trace.zip`
3. **Identify failure** — which selector failed?
4. **Analyze DOM** — what is the actual structure?
5. **Fix selector** — use recommended patterns
6. **Push new commit** — do not force-push
7. **Wait for CI** — verify fix works

## Branch Protection (Owner Action Required)

The repository owner should enable branch protection for `main`:

| Setting | Value |
|---------|-------|
| Require pull request reviews | 1 minimum |
| Require status checks to pass | `E2E PROD Safe / test` |
| Require branches to be up to date | Yes |

## Workflow Files

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `e2e-prod-safe.yml` | `pull_request` | Full E2E suite |
| `smoke.yml` | `pull_request`, `workflow_dispatch` | Quick auth check |

## Contact

For questions about QA governance, contact the repository maintainers.
