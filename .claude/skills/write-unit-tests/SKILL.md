---
name: write-unit-tests
description: Write unit tests for a specific file in this repo (typically something in `src/lib`). Use when the user asks to "write unit tests", "add tests for <file>", "cover <file> with tests", or runs `/write-unit-tests <path>`. If no target file is given, ask for one before doing anything else.
---

# Write Unit Tests

Write unit tests for a single source file. The target is usually a repository, service, or utility under `src/lib` — that's the backend code CLAUDE.md requires tests for.

## Inputs

- **Target file** (required). A path like `src/lib/services/companyService.ts`. If the user did not provide one, STOP and ask:
  > Which file should I write unit tests for? Please give me a path (e.g. `src/lib/services/companyService.ts`).
  Do not guess. Do not pick a file yourself.

## Before writing tests

1. **Check the test runner.** This repo does not have a unit test framework wired up yet (only Playwright for e2e). Check `package.json` — if there's no `vitest` / `jest` dependency and no `test` script, stop and ask the user:
   > This repo has no unit test runner configured. I'd like to add **Vitest** (`vitest` + `@vitest/ui`) with a `test` script. OK to proceed?
   Wait for confirmation before installing anything or writing a config.

2. **Read the target file and its direct imports.** Understand what the exports do, what they depend on, and which dependencies need to be mocked (DB via Drizzle, S3 client, Anthropic SDK, etc.). Do not stub out things that are pure.

3. **Locate existing tests, if any.** `find src -name "*.test.ts" -not -path "*/node_modules/*"`. Match the existing style if tests already exist.

## Writing the tests

- **Location.** Co-locate next to the source file: `src/lib/services/companyService.ts` → `src/lib/services/companyService.test.ts`.
- **Framework.** Vitest (unless the repo already chose something else). Use `describe` / `it` / `expect`.
- **TypeScript strict.** No `any`, no `!` non-null assertions, no `@ts-ignore`. Type your mocks.
- **Coverage.** For each exported function:
  - Happy path with representative input.
  - Each distinct branch (if/else, early returns, error paths).
  - Boundary cases the code actually handles (empty arrays, missing optional fields, zero/negative numbers where relevant).
  - Error propagation — if the function throws or returns an error shape, test that explicitly.
- **Do not test** private helpers indirectly through three layers of public API when you can import and test them directly. But don't export something *just* to test it — prefer testing through the public surface.
- **Mocks.** Mock the data layer (`repositories/*`), external SDKs (`@anthropic-ai/sdk`, `@aws-sdk/*`), and anything that does I/O. Use `vi.mock()`. Real Drizzle calls in unit tests are a no.
- **Async jobs.** If the code under test enqueues a row in `jobs` or writes to `job_logs` (per CLAUDE.md), assert on those calls — that's the contract.

## After writing

1. Run the tests: `pnpm test <path-to-new-test-file>` (or `pnpm exec vitest run <path>`).
2. If anything fails, fix the tests (or the code if the test surfaced a real bug — flag this clearly to the user).
3. Report: what was tested, what was mocked, and anything you *chose not to* cover with a one-line reason.

## What not to do

- Don't write tests for files the user didn't ask about.
- Don't refactor the source file to make it "more testable" unless the user asked — flag it as a suggestion instead.
- Don't add snapshot tests for logic — snapshots are for rendered output, not business logic.
- Don't claim tests pass without actually running them.
