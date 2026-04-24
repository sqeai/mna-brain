---
name: write-e2e-tests
description: Write Playwright end-to-end tests for this repo, aimed at QA engineers. Use when the user asks to "write e2e tests", "add Playwright tests for <flow>", or runs `/write-e2e-tests <test cases>`. Accepts test cases as parameters describing the scenarios to cover. If none are given, ask the user to list them before writing anything.
---

# Write End-to-End Tests

Write Playwright specs in `e2e/` that exercise real user flows through the Next.js app. Audience is QA, so tests must be readable, deterministic, isolated, and assertive about user-visible behavior — not implementation details.

## Inputs

- **Test cases** (required). A list of scenarios the user wants covered, e.g.:
  - "User uploads a PDF and sees it parsed in the deal room"
  - "Screening filter by sector returns matching companies only"
  - "Login with invalid password shows error and stays on /login"

  If the user did not provide any, STOP and ask:
  > What scenarios should the e2e tests cover? Please list them — one bullet per case, with the expected outcome. I need these before I can write the spec.

  Do not invent scenarios. Do not pad with "obvious" extra cases unless the user asks.

## Before writing

1. **Read `playwright.config.ts`** to confirm `baseURL`, `webServer` command, retries, and trace settings.
2. **Read an existing spec** (e.g. `e2e/login.spec.ts`, `e2e/dashboard.spec.ts`) to match style: `test.describe` grouping, `beforeEach` for navigation, `page.route(...)` for API mocking, web-first `expect(...).toBeVisible()` assertions.
3. **Identify the feature's route and the selectors that actually exist.** Open the relevant `src/app/**/page.tsx` (and child components) and note stable, user-facing handles — roles, labels, accessible names. If the product has no accessible name for an important control, flag it; that's a real a11y issue, not just a test problem.
4. **Decide the data strategy.**
   - If the flow hits `/api/**`, mock with `page.route('**/api/...', route => route.fulfill({...}))` as `login.spec.ts` does. Hermetic by default.
   - Only hit the real DB if the user explicitly asks for an integration-level check and the local Postgres (docker-compose) is expected to be up.

## Playwright best practices — follow these every time

- **User-facing locators, in priority order:** `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId`. Use `locator('#id')` only when no accessible name exists, and flag it.
- **No brittle locators.** No deep CSS class chains, no XPath, no `nth-child` unless order is part of the product contract. Use `.filter({ hasText: ... })` to disambiguate, not positional indexes.
- **Web-first assertions only.** `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`, `toHaveValue`, `toBeDisabled`, `toBeChecked`. They auto-retry. Prefer `await expect(page).toHaveURL(...)` over `page.waitForURL(...)` for final-URL checks.
- **No arbitrary sleeps.** Never `page.waitForTimeout(...)`. If you need to wait, assert the observable outcome.
- **One user outcome per `test(...)`.** Structure as given → when → then. Don't chain multiple unrelated flows in a single test.
- **Independent tests.** Each `test(...)` must run standalone. No state leaked between tests. Shared setup goes in `beforeEach`.
- **Hermetic mocks.** API responses returned via `page.route` must match the real handler's shape — skim `src/app/api/**` before inventing a payload. Wrong shapes create false greens.
- **Auth seeding.** Logged-in flows: seed `localStorage.mna_tracker_user` via `page.addInitScript` before `page.goto` — see `e2e/login.spec.ts:76-83`. Don't log in via UI in every test.
- **TypeScript strict.** No `any`, no non-null `!`, no `@ts-ignore`. Type request/response payloads.
- **Don't test third parties.** Mock external SDKs (Anthropic, S3) at the network layer; don't verify their internals.
- **Use codegen as a starting point if helpful** (`pnpm exec playwright codegen http://localhost:3000/<route>`), but clean its CSS-chain locators into role-based ones before committing.
- **Trust the config.** Retries (`2` in CI) and `trace: 'on-first-retry'` are already set — don't override per-test without reason.

## Writing the spec

- **Location.** `e2e/<feature>.spec.ts`. One feature per file. Group related cases with `test.describe`.
- **Shape each test as given → when → then.** One user-visible outcome per `test(...)`.
- **Mocks.** Put shared mocks in `beforeEach`; case-specific mocks at the top of the `test(...)`. Return realistic payloads.
- **Soft assertions** (`expect.soft`) are fine for multi-field dumps where you want all failures reported, but default to hard assertions.
- **Don't branch inside a test.** No `if`/`try`/`catch` around assertions to "handle either case" — that hides real failures. If the UI can legitimately show two states, write two tests.

## After writing

1. Run the new spec: `pnpm test:e2e e2e/<feature>.spec.ts`.
2. First run is slow because Playwright boots the Next.js dev server per `playwright.config.ts`. Give Bash a generous timeout (e.g. 300000ms).
3. If a test fails, investigate before retrying. Flake from timing? Wrong selector? Real product bug? Report which — don't just rerun.
4. Deliver: files added, which user-given case each `test(...)` covers, and any cases you couldn't cover with a one-line reason (e.g. "needs a real upload fixture — please provide").

## What not to do

- Don't write tests for cases the user didn't ask for.
- Don't share state across tests.
- Don't mock what you're actually trying to test. If the user asked to verify the real `/api/login` flow, don't stub it.
- Don't use `page.waitForTimeout`, brittle CSS chains, or conditional logic inside a `test(...)`.
- Don't claim a test passes without running it locally.
