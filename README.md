# WK CRM E2E Tests

Playwright-based end-to-end tests for [WK CRM](https://crm.wkconnect.de) (PROD environment).

## Safety Protocols

This test suite is designed to run safely against PROD:

| Protocol | Implementation |
|----------|----------------|
| **TEST_ prefix** | All created entities use `TEST_` prefix for easy identification |
| **Cleanup** | Every test that creates data has mandatory cleanup in `afterEach` |
| **No PII** | Only synthetic data used (test@wkconnect.de, fake names) |
| **CI Gate** | Tests run on PR and manual trigger only |
| **workers=1** | Single worker to avoid load on PROD |
| **fullyParallel=false** | Sequential test execution |
| **trace=on-first-retry** | Debugging artifacts on failure |

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
npx playwright install chromium
```

### Environment Variables

Set these in your environment or GitHub Secrets:

```bash
export CRM_USER="your-test-user@wkconnect.de"
export CRM_PASS="your-password"
export BASE_URL="https://crm.wkconnect.de"  # Optional, defaults to PROD
```

## Running Tests

```bash
# Run all tests
npm test

# Run with headed browser
npm run test:headed

# Run with debug mode
npm run test:debug

# Run smoke tests only
npx playwright test tests/smoke-prod.spec.ts

# View HTML report
npm run report
```

## GitHub Actions Workflows

### E2E PROD Safe (`.github/workflows/e2e.yml`)

Main E2E test suite triggered on pull requests.

| Trigger | Purpose |
|---------|---------|
| `pull_request` | Validate PR changes |
| `workflow_dispatch` | Manual run |

### E2E PROD Scheduled (`.github/workflows/e2e-prod-scheduled.yml`)

Automated health check running every 6 hours.

| Trigger | Purpose |
|---------|---------|
| `schedule` (cron: `0 */6 * * *`) | Every 6 hours |
| `workflow_dispatch` | Manual run |

**To run manually:**
1. Go to Actions → E2E PROD Scheduled
2. Click "Run workflow"
3. Select branch and click "Run workflow"

### Smoke PROD (`.github/workflows/smoke-prod.yml`)

Quick health check for critical pages (login, contact-center, leads, tasks).

| Trigger | Purpose |
|---------|---------|
| `workflow_dispatch` | Manual run only |

**To run manually:**
1. Go to Actions → Smoke PROD
2. Click "Run workflow"
3. Select browser (chromium/firefox/webkit)
4. Click "Run workflow"

**What it tests:**
- Login functionality
- Contact Center page loads
- CRM Leads page loads
- Tasks page loads

## Test Suites

### auth.spec.ts

Tests login functionality:
- Valid credentials → successful login
- Invalid credentials → error handling

### lead-lifecycle.spec.ts

Tests lead CRUD operations:
- Create lead with `TEST_` prefix
- Verify lead appears in list
- **Cleanup**: Archive/delete lead after test

### smoke-prod.spec.ts

Quick health check (read-only, no data creation):
- Login and verify shell
- Load Contact Center
- Load CRM Leads
- Load Tasks

## Artifacts

On test failure, the following artifacts are uploaded:
- `playwright-report/` - HTML test report
- `test-results/` - Traces, videos, screenshots

Artifacts are retained for:
- Scheduled runs: 14 days
- Smoke runs: 7 days
- PR runs: default retention

## Required Secrets

Configure these in GitHub Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `CRM_USER` | Test user email |
| `CRM_PASS` | Test user password |
| `BASE_URL` | (Optional) Base URL, defaults to `https://crm.wkconnect.de` |

## Troubleshooting

### If tests fail

1. Download artifacts from the failed workflow run
2. Open trace: `npx playwright show-trace test-results/*/trace.zip`
3. Analyze the failure:
   - **Selector issue** → Fix in `wk-crm-tests`
   - **PROD bug** → Create issue in `wkconnect/AgentHab`

### Common issues

| Issue | Solution |
|-------|----------|
| Login fails | Check CRM_USER/CRM_PASS secrets |
| Timeout on shell | Increase timeout or check PROD status |
| Element not found | Update selector using trace viewer |

## Contributing

1. All tests MUST use `TEST_` prefix for created entities
2. All tests MUST have cleanup in `afterEach`
3. No real PII - use synthetic data only
4. Run tests locally before PR
5. If CI fails, analyze trace before "fixing" tests

## License

Internal use only - W&K Connect
