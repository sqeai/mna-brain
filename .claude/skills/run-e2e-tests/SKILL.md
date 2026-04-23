---
name: run-e2e-tests
description: Run the Playwright e2e test suite via the pnpm script. Use when the user asks to "run e2e tests", "run the e2e suite", runs `/run-e2e-tests`, or wants to verify UI flows after changes. Accepts an optional filter (spec file path or test-name pattern) to run a subset.
---

# Run End-to-End Tests

Runs Playwright via `pnpm test:e2e`. The dev server is started automatically by `playwright.config.ts` (`webServer.command: 'pnpm dev'`, `reuseExistingServer: !CI`) — you do not need to boot it separately.

## Inputs

- **Filter** (optional). Either:
  - A spec path: `e2e/login.spec.ts` — runs only that file.
  - A `-g` pattern: `-g "shows error"` — runs only matching test names.
  - Nothing — runs the whole suite.

## Steps

1. **Pick the command.**
   - Full suite: `pnpm test:e2e`
   - Single file: `pnpm test:e2e e2e/<file>.spec.ts`
   - Pattern: `pnpm test:e2e -g "<pattern>"`
   - Only the tests that failed last run: `pnpm test:e2e --last-failed`
   - UI mode (only if the user explicitly asks): `pnpm test:e2e:ui`
   - Step-through debugger (only if the user asks): `pnpm test:e2e --debug`

2. **Run it.** Use the Bash tool. First run can take >60s because Playwright boots the Next.js dev server; set a generous timeout (e.g. 300000ms). Do not pass `--quiet`, do not background the run, do not redirect output — the user wants to see the failures.

3. **Report the result.**
   - If all green: one line — "N tests passed in <file>." Include the command used.
   - If anything failed: for each failure, report the spec, test name, and the essential error (the assertion message or the first stack line pointing into `e2e/`). Point the user at:
     - `playwright-report/index.html` — the HTML report
     - `pnpm exec playwright show-trace test-results/<…>/trace.zip` — trace viewer for the first retry (enabled by `trace: 'on-first-retry'` in the config)
   - Do not re-run on flake without asking. If a test looks flaky (passes on retry, relies on timing), say so and ask whether to retry or fix.

## When a test fails — triage, don't just rerun

Before recommending a re-run, classify the failure:

- **Real product bug** — assertion describes a user-visible regression. Report the feature area and the exact mismatch.
- **Selector drift** — the markup changed. Point at the spec line and the page under `src/app/**` that drifted.
- **Flaky wait** — test uses `waitForTimeout` or a non-retrying check. Flag it for `update-e2e-test` to convert to a web-first assertion.
- **Environment** — dev server didn't come up, port conflict, missing env var. Report the underlying error, don't retry blindly.

## What not to do

- Don't modify spec files to make failing tests pass — that's `update-e2e-test` / `write-e2e-tests`, and only when the user asks.
- Don't start a separate `pnpm dev` in the background; Playwright owns the server lifecycle via `webServer`.
- Don't suppress output with `--quiet` or similar.
- Don't claim success without reading the actual command exit code and the Playwright summary line.
- Don't delete `test-results/` or `playwright-report/` — the user (or the next skill run) needs them for triage.
