# Testing Patterns

**Analysis Date:** 2026-06-09

## Test Framework

**Runner:**
- Not configured — no `jest.config.*`, `vitest.config.*`, or test runner declared in `package.json`
- The CI pipeline (`corepack pnpm test --if-present`) runs tests only if a `test` script is present; for this repo, the step silently skips

**Assertion Library:**
- Not applicable — no test files exist in this repo

**Run Commands:**
```bash
# No standalone test command defined
# Monorepo runs tests for this package via the host workspace
corepack pnpm test --if-present   # used by CI; silently skips if no test script
```

## Test File Organization

**Location:**
- No test files exist in this repo (`*.test.*`, `*.spec.*` — none found)
- This is a source-mirror repo: test execution is owned by the cinatra monorepo that clones this repo into its workspace

**Naming:**
- Not applicable

**Structure:**
- Not applicable

## Test Strategy — CI Gates Instead of Unit Tests

This repo relies on two CI gate mechanisms rather than traditional unit tests:

**1. Dependency Shape Gate (`ci.yml` build job):**
- Validates `package.json` first-party dependency rules: all `@cinatra-ai/*` packages must be `peerDependencies` with `peerDependenciesMeta[pkg].optional: true`
- Leaking first-party packages into `dependencies`/`devDependencies` fails with exit 2
- Implemented inline in `.github/workflows/ci.yml` as a `node -e` one-liner

**2. Agent OAS Validation Gate (`extension-kind-gate.mjs`):**
- Run by CI kind-gates job: `node extension-kind-gate.mjs --package-root .`
- Validates `cinatra/oas.json` parses correctly
- Scans all LLM-visible strings (`system`, `user`, `description` fields) for retired CRM primitives
- Banned primitives: `lists_*`, `accounts_*`, `contacts_*` (legacy), `objects_list` over CRM types
- Banned type hints: `@cinatra-ai/entity-accounts:account`, `@cinatra-ai/entity-contacts:contact`
- Uses word-boundary regex matching to avoid false positives
- Pure functions (`validateAgent`, `validateBpmnSanity`, etc.) are exported from `extension-kind-gate.mjs`, making them unit-testable by the monorepo

## Gate Function Design (Testability)

The gate is structured for pure-function testability (even though tests live in the monorepo):

```javascript
// Pure: returns string[] errors — no side effects, easy to unit test
export function validateAgent(packageRoot) { ... }
export function validateBpmnSanity(xml) { ... }
export function validateWorkflowPackageShape(pkg) { ... }
export function findWorkflowSidecars(packageRoot) { ... }
export function runGate(packageRoot) { ... } // returns { kind, errors }
```

**Pattern:** All validators return `string[]` (empty = pass, non-empty = failures). The `main()` entry point is the only impure function (reads args, writes to stdout/stderr, calls `process.exit`).

**Invocation guard** ensures `main()` only runs when the file is the direct Node entry point:
```javascript
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) { main(); }
```

## Mocking

**Framework:** Not applicable — no test suite in this repo

**What the monorepo mocks (inferred from architecture):**
- File system (`readFileSync`, `existsSync`, `readdirSync`) for gate unit tests
- `process.argv` and `process.exit` for `parseArgs`/`main` tests

## Fixtures and Factories

**Test Data:**
- Not applicable in this repo
- `cinatra/oas.json` serves as a real fixture for the OAS gate when run in CI

## Coverage

**Requirements:** Not enforced in this repo

**View Coverage:**
```bash
# Not configured — coverage is owned by the cinatra monorepo
```

## Test Types

**Unit Tests:**
- None in this repo; pure functions in `extension-kind-gate.mjs` are tested by the monorepo

**Integration Tests:**
- The CI pipeline itself is the integration test: `node extension-kind-gate.mjs --package-root .` exercises the full gate against the real `cinatra/oas.json`

**E2E Tests:**
- Not applicable — agent runtime behavior is tested end-to-end in the cinatra monorepo against a live LLM bridge

## Typecheck as Quality Gate

TypeScript compilation is used as a correctness gate in CI (`ci.yml`):

```bash
# For standalone repos (no @cinatra-ai/* peers):
npx -y -p typescript tsc --noEmit
# or if typescript is in devDeps:
corepack pnpm exec tsc --noEmit
```

Config: `tsconfig.json` with `"strict": true`, `"noImplicitAny": false`, `"verbatimModuleSyntax": true`, targeting `ES2023`.

## Pack Dry-Run Gate

```bash
npm pack --dry-run
```

Validates the npm publish payload shape (files included, package.json validity) without publishing. Runs on every CI build as a final sanity check.

---

*Testing analysis: 2026-06-09*
