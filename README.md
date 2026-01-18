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
```

## Running Tests

```bash
# Run all tests
npm test

# Run with headed browser
npm run test:headed

# Run with debug mode
npm run test:debug

# View HTML report
npm run report
```

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

## CI/CD

GitHub Actions workflow (`.github/workflows/e2e.yml`):
- Triggers: `pull_request`, `workflow_dispatch`
- Artifacts: HTML report + traces/videos on failure
- Secrets required: `CRM_USER`, `CRM_PASS`

## Artifacts

On test failure, the following artifacts are uploaded:
- `playwright-report/` - HTML test report
- `test-results/` - Traces, videos, screenshots

## Contributing

1. All tests MUST use `TEST_` prefix for created entities
2. All tests MUST have cleanup in `afterEach`
3. No real PII - use synthetic data only
4. Run tests locally before PR

## License

Internal use only - W&K Connect
