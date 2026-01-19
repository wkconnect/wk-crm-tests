# WK CRM TESTS — Pull Request Evidence & Acceptance

## Summary

<!-- Brief description of what this PR changes -->

## Test Results

| Test Spec | Status | Duration | Notes |
|-----------|--------|----------|-------|
| auth.spec.ts | ⏳ | - | - |
| lead-lifecycle.spec.ts | ⏳ | - | - |

**CI Run Link:** [Actions Run](#)

## Evidence Checklist

### Required for Merge

- [ ] CI passed (green check) — **MANDATORY**
- [ ] `TEST_` prefix used for all created entities
- [ ] Cleanup executed (lead archived/deleted after test)
- [ ] No PII used (only synthetic data: test@wkconnect.de)
- [ ] Artifacts uploaded on failure (trace/video/screenshot)

### Safety Protocols Verified

- [ ] `workers: 1` in playwright.config.ts
- [ ] `fullyParallel: false` in playwright.config.ts
- [ ] `trace: 'on-first-retry'` configured
- [ ] Cleanup runs in `afterEach` (even on failure)

### Selector Policy

- [ ] Used `getByRole()` / `getByLabel()` / `data-*` attributes first
- [ ] Avoided fragile CSS selectors (`#id`, `.class`)
- [ ] No `hasText` filter on generic elements

## Failure Analysis (if CI red)

<!-- If CI failed, document the analysis here -->

### Error Message

```
<!-- Paste error from CI logs -->
```

### Root Cause

<!-- What caused the failure? -->

### Fix Applied

<!-- What was changed to fix it? -->

## Screenshots / Artifacts

<!-- Attach relevant screenshots or link to artifacts -->

## Notes

<!-- Additional context or information -->

---

> **Golden Rule:** This PR can only be merged if CI is green.
> If CI is red, analyze the trace, fix selectors, and create a new commit.
