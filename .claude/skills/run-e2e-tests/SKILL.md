---
name: run-e2e-tests
description: Run the Playwright e2e test suite via the pnpm script. Use when the user asks to "run e2e tests", "run the e2e suite", runs `/run-e2e-tests`, or wants to verify UI flows after changes. Accepts an optional filter (spec file path or test-name pattern) to run a subset.
---

# Run End-to-End Tests

Runs Playwright via `pnpm test:e2e`. The dev server is started automatically by `playwright.config.ts` (`webServer.command: 'pnpm dev'`) — you do not need to boot it separately.

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
   - UI mode (only if the user explicitly asks): `pnpm test:e2e:ui`

2. **Run it.** Use the Bash tool. First run can take >60s because Playwright boots the Next.js dev server; set a generous timeout (e.g. 300000ms).

3. **Report the result.**
   - If all green: one line — "N tests passed in <file>." Include the command used.
   - If anything failed: for each failure, report the spec, test name, and the essential error (the assertion message or the first stack line pointing into `e2e/`). Link to the HTML report at `playwright-report/index.html`.
   - Do not re-run on flake without asking. If a test looks flaky, say so and ask whether to retry.

## What not to do

- Don't modify spec files to make failing tests pass — that's the `write-e2e-tests` skill's job, and only when the user asks.
- Don't start a separate `pnpm dev` in the background; Playwright owns the server lifecycle.
- Don't suppress output with `--quiet` or similar — the user wants to see failures.
- Don't claim success without reading the actual command exit code and summary line.
