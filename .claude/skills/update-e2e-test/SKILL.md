---
name: update-e2e-test
description: Update an existing Playwright e2e test in `e2e/`. Use when the user asks to "update the e2e test for <feature>", "modify <spec>", "fix the flaky selector in <test>", or runs `/update-e2e-test <spec> <change>`. If the target spec is not given, ask before touching anything.
---

# Update an End-to-End Test

Modify an existing Playwright spec under `e2e/` — to cover a new assertion, adapt to UI changes, fix flakiness, or tighten selectors. Keep the rest of the file stable; do not rewrite unrelated tests.

## Inputs

- **Target spec** (required). A path like `e2e/login.spec.ts`. If the user did not name one, STOP and ask:
  > Which e2e test should I update? Please give me a spec path (e.g. `e2e/dashboard.spec.ts`) and, if you can, the `test(...)` name inside it.

  If multiple specs plausibly match (e.g. "the login test" but there's also a `signup.spec.ts`), list candidates from `ls e2e/` and ask which one.

- **Requested change** (required). What should be different after the edit — a new case, a bug fix, a selector swap, a mock update. If the user only named a spec, ask:
  > What should change in `e2e/<file>.spec.ts`? New scenario? Selector/assertion fix? Mock update? Flake repair?

  Do not guess. Do not "improve" unrelated tests in the same file.

## Before editing

1. **Read the target spec in full.** Note the existing patterns: `test.describe` grouping, `beforeEach` setup, mock payload shape, selector style.
2. **Read `playwright.config.ts`.** Confirm `baseURL`, `webServer`, retries, and trace settings so your changes respect them.
3. **Read the page(s) under test.** Open the relevant `src/app/**/page.tsx` (and any child components) to verify current markup, roles, labels, and API endpoints. The test must match what the UI actually renders today, not what it used to.
4. **Check for test data coupling.** If the test seeds `localStorage.mna_tracker_user` or mocks `/api/**`, make sure the payload still matches the server's current response shape (check `src/app/api/**`).

## Applying the change — Playwright best practices

Follow these regardless of what the existing file does. If the existing file violates them, fix the part you're touching; leave the rest alone unless the user asked for a sweep.

- **User-facing locators first.** Prefer, in order: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByTestId`. Fall back to `locator('#id')` only when no accessible name exists — and flag that as a product a11y gap.
- **Avoid brittle locators.** No CSS class chains (`.btn.btn-primary > span`), no XPath, no `nth-child` unless the list order is part of the contract.
- **Web-first assertions.** Use `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`, `toHaveValue`, `toBeDisabled`. They auto-retry. Prefer `await expect(page).toHaveURL(...)` over `page.waitForURL(...)` when asserting the final URL.
- **No `waitForTimeout` / arbitrary sleeps.** If something needs waiting, assert the observable outcome instead.
- **One user outcome per `test(...)`.** If the requested change adds a second outcome, add a new `test(...)` rather than stapling assertions onto an existing one.
- **Isolate.** Do not rely on state leaked from a previous `test(...)`. Put shared setup in `beforeEach`, not in a sibling test.
- **Hermetic by default.** API calls go through `page.route('**/api/...', route => route.fulfill({...}))`. Payloads must match the real response contract — check the handler under `src/app/api/**`.
- **Auth seeding.** Use `page.addInitScript` to set `localStorage.mna_tracker_user` before navigation — see `e2e/login.spec.ts` for the pattern. Do not try to log in via the UI in every test.
- **Strict types.** No `any`, no `@ts-ignore`. Type mock payloads.
- **Fixtures over duplication.** If the same mock/auth setup appears three times, lift it into a `test.beforeEach` or a typed helper in the same file. Don't create a shared fixture module unless the user asks.
- **Traces and retries are already configured** (`trace: 'on-first-retry'`, `retries: 2` in CI). Don't add per-test `test.setTimeout` or disable retries without a reason.

## Editing rules

- Use the **Edit** tool with a tight `old_string` — do not rewrite the whole file.
- Preserve surrounding formatting, imports, and unrelated tests byte-for-byte.
- If a change renames a `test(...)` title or a `describe` block, search the repo for references (CI filters, docs) before committing to the rename.
- If the requested change can't be made without also fixing something the user didn't ask about (e.g. a shared `beforeEach` is broken), stop and surface it:
  > To do X, I also need to change Y because `<reason>`. OK to do both, or should I scope this differently?

## After editing

1. Run the specific spec: `pnpm test:e2e e2e/<file>.spec.ts`. For a single case, add `-g "<test name>"`.
2. If it fails:
   - Read the failure. Is it the assertion you just added, a selector drift, or a real product bug? Report which — don't just retry.
   - Check `playwright-report/index.html` and the trace for the first retry.
3. If it passes, run the whole file once more to confirm you didn't break a sibling test:
   `pnpm test:e2e e2e/<file>.spec.ts`.
4. Report: which `test(...)` you changed, what the change was, command used, pass/fail. If you left any requested sub-item undone, say so with a one-line reason.

## What not to do

- Don't modify tests the user didn't name.
- Don't "refactor" selectors across the file just because you noticed they're brittle — only fix what you touch, and flag the rest.
- Don't delete a failing test to make the suite green. If a test is obsolete, ask the user to confirm removal.
- Don't loosen assertions (`toBeVisible` → `toBeAttached`, `toHaveURL(exact)` → `toHaveURL(regex)`) to paper over a failure. Investigate first.
- Don't claim the update works without running it.
