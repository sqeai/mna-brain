---
name: write-e2e-tests
description: Write Playwright end-to-end tests for this repo, aimed at QA engineers. Use when the user asks to "write e2e tests", "add Playwright tests for <flow>", or runs `/write-e2e-tests <test cases>`. Accepts test cases as parameters describing the scenarios to cover. If none are given, ask the user to list them before writing anything.
---

# Write End-to-End Tests

Write Playwright specs in `e2e/` that exercise real user flows through the Next.js app. Audience is QA, so tests should be readable, deterministic, and assertive about user-visible behavior.

## Inputs

- **Test cases** (required). A list of scenarios the user wants covered, e.g.:
  - "User uploads a PDF and sees it parsed in the deal room"
  - "Screening filter by sector returns matching companies only"
  - "Login with invalid password shows error and stays on /login"

  If the user did not provide any, STOP and ask:
  > What scenarios should the e2e tests cover? Please list them — one bullet per case, with the expected outcome. I need these before I can write the spec.

  Do not invent scenarios. Do not pad with "obvious" extra cases unless the user asks.

## Before writing

1. **Read `playwright.config.ts`** to confirm `baseURL`, web server command, and project settings.
2. **Read an existing spec** (e.g. `e2e/login.spec.ts`, `e2e/dashboard.spec.ts`) to match style: `test.describe` grouping, `beforeEach` for navigation, `page.route(...)` for API mocking, `expect(...).toBeVisible()` for assertions.
3. **Identify the feature's route and selectors.** Open the relevant page under `src/app/**/page.tsx` and note stable selectors — prefer `getByRole`, `getByText`, `getByLabel`, or `#id` over brittle CSS class chains.
4. **Decide on data strategy.**
   - If the flow hits `/api/**`, mock with `page.route('**/api/...', route => route.fulfill({...}))` like `login.spec.ts` does. This keeps tests hermetic.
   - Only hit the real DB if the user explicitly asks for an integration-level check and the local Postgres (docker-compose) is expected to be up.

## Writing the spec

- **Location.** `e2e/<feature>.spec.ts`. One feature per file. Group related cases with `test.describe`.
- **Shape each test as given → when → then.** One user-visible outcome per `test(...)`. Don't chain multiple unrelated flows.
- **Selectors.** Prefer accessible locators (`getByRole('button', { name: 'Sign In' })`) over `page.locator('.some-class')`. If an element has no good accessible name, flag it — that's a product accessibility issue worth noting.
- **Waits.** Use `await expect(locator).toBeVisible()` / `toHaveURL(...)`. Never `waitForTimeout` — it's flaky.
- **API mocks.** Put mocks at the top of the test or in `beforeEach` if shared. Return realistic payloads; don't invent fields that don't match the server's response shape (skim the handler in `src/app/api/**`).
- **Auth.** If the flow requires a logged-in user, seed `localStorage.mna_tracker_user` via `page.addInitScript` — see `login.spec.ts:76-83` for the pattern.
- **TypeScript strict.** Type request/response payloads. No `any`.

## After writing

1. Run the new spec: `pnpm test:e2e e2e/<feature>.spec.ts`.
2. If the dev server isn't running, Playwright will start it (per `playwright.config.ts`). First run is slow — that's expected.
3. If a test fails, investigate before retrying. Flaky wait? Wrong selector? Real product bug? Report which.
4. Deliver: list of files added, which user-given cases each `test(...)` covers, and any cases you couldn't cover with a one-line reason (e.g. "needs a real upload fixture — please provide").

## What not to do

- Don't write tests for cases the user didn't ask for.
- Don't share state across tests — each `test(...)` should be independently runnable.
- Don't mock what you're actually trying to test. If the user asked to verify the real `/api/login` flow, don't stub it.
- Don't claim a test passes without running it locally.
