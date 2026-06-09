# Coding Conventions

**Analysis Date:** 2026-06-09

## Naming Patterns

**Files:**
- `camelCase.mjs` for standalone Node.js utility scripts: `extension-kind-gate.mjs`
- `UPPER_CASE.md` for skill/documentation files: `skills/apollo-prospecting-agent/SKILL.md`
- `oas.json` for OAS agent spec sidecars under `cinatra/`
- `index.ts` as the sole TypeScript entry point under `src/`

**Functions:**
- camelCase for all exported functions: `parseArgs`, `validateAgent`, `validateWorkflow`, `runGate`, `walkLlmStrings`, `scanOasString`, `findWorkflowSidecars`, `validateBpmnSanity`, `validateWorkflowPackageShape`
- Private/internal helpers also camelCase: `wordBoundary`, `prefixOf`, `localOf`

**Variables:**
- camelCase throughout: `packageRoot`, `oasPath`, `findings`, `bpmnPrefixes`, `openTags`
- Constants that are truly constant use UPPER_SNAKE_CASE: `LLM_VISIBLE_FIELDS`, `BANNED_PRIMITIVES`, `BANNED_TYPEHINTS`, `PRIMITIVE_PATTERNS`, `BPMN_MODEL_NS`, `WORKFLOW_PACKAGE_NAME_RE`

**Types:**
- TypeScript `as const` for literal narrowing: `kind: "agent" as const` in `src/index.ts`
- No custom type aliases in this small repo — types inferred from structure

**OAS/JSON fields:**
- Flow inputs/outputs use `camelCase` field names: `organizationDomains`, `titlePatterns`, `maxPersons`, `listId`, `apolloHitCount`, `addedToList`
- Apollo external API fields use `snake_case` (as returned by Apollo): `p.first_name`, `p.last_name`, `p.linkedin_url`, `p.organization_id`
- CRM facade tool parameters use `camelCase`: `domainName`, `apolloOrganizationId`, `linkedinUrl`, `apolloPersonId`

## Code Style

**Formatting:**
- Not explicitly configured (no `.prettierrc`, `.eslintrc`, or `biome.json` present)
- Indentation: 2 spaces (observed in `extension-kind-gate.mjs` and `cinatra/oas.json`)
- Double quotes for strings in JavaScript/TypeScript source
- Trailing commas in multiline arrays/objects

**Linting:**
- No linter config detected — the CI gate (`extension-kind-gate.mjs`) is the primary code-quality enforcement mechanism
- TypeScript strict mode enabled in `tsconfig.json` (`"strict": true`), but `"noImplicitAny": false`

## Import Organization

**Order (observed in `extension-kind-gate.mjs`):**
1. Node built-in modules with `node:` prefix: `import { readFileSync, existsSync, readdirSync } from "node:fs"`
2. Node built-in path utilities: `import { resolve, join, basename, dirname, relative } from "node:path"`
3. No third-party imports (deliberately zero-dependency)

**Path Aliases:**
- None — standalone repo with no monorepo aliases

**Module system:**
- ESM throughout (`"type": "module"` in `package.json`)
- `extension-kind-gate.mjs` uses explicit `.mjs` extension to signal ESM
- `src/index.ts` uses `verbatimModuleSyntax` (TypeScript ESM with no synthetic CJS)

## Error Handling

**Patterns in `extension-kind-gate.mjs`:**
- Functions return `string[]` error arrays (pure, no throws): `validateAgent`, `validateWorkflow`, `validateBpmnSanity`, `validateWorkflowPackageShape`
- File I/O wrapped in `try/catch`; error converted to string via `err instanceof Error ? err.message : String(err)`
- Early-return on fatal parse errors (can't proceed without parsed JSON)
- Errors accumulated and returned rather than thrown; the caller (main/runGate) decides exit code

**Agent behavior (SKILL.md):**
- Never abort entire run on a single step failure — append `{ name, error }` to `failures[]` and continue
- Pre-check pattern: Step 1 is always an Apollo connectivity check; abort only if connection fails
- All outputs default to empty arrays / zero integers so partial success is always returnable

## Logging

**Framework:** `console.log` / `console.error` (no logging library)

**Patterns:**
- Success output to stdout: `console.log("✓ extension-kind-gate: ...")`
- Error output to stderr: `console.error("✗ extension-kind-gate: ...")`
- Bullet-prefixed error list: `console.error("  • " + e)` for human readability in CI

## Comments

**When to Comment:**
- File-level block comments explain purpose, scope, and usage: `extension-kind-gate.mjs` opens with a 30-line block comment covering purpose, self-contained constraint, scope, usage, and exit codes
- Section separator comments (`// ---`) divide logical blocks within large files
- Individual exported functions have JSDoc-style `/** ... */` comments explaining contract and constraints
- Inline comments explain non-obvious behavior (e.g., why `--no-frozen-lockfile` is used, why `npx` is preferred over `pnpm dlx`)

**JSDoc/TSDoc:**
- Used on exported pure functions in `extension-kind-gate.mjs`: `/** Validate an agent extension … Pure: returns string[] errors. */`
- Not used in `src/index.ts` (trivial placeholder)

## Function Design

**Size:** Functions are small and single-purpose; largest is `validateBpmnSanity` (~80 lines) which handles a complex XML walk but is still self-contained

**Parameters:** Single options object or explicit named primitives; no variadic args

**Return Values:** Pure functions return `string[]` (errors); impure entry points return `{ kind, errors }` objects. Never throw for domain errors — always return.

## Module Design

**Exports:** Named exports only; no default exports
- `extension-kind-gate.mjs` exports all validator functions for potential programmatic use: `parseArgs`, `validateAgent`, `validateWorkflow`, `validateBpmnSanity`, `validateWorkflowPackageShape`, `findWorkflowSidecars`, `runGate`
- `src/index.ts` exports a single named const `apolloProspectingAgent`

**Barrel Files:** Not applicable — only one source file per module layer

**Self-contained constraint:** `extension-kind-gate.mjs` explicitly must use only Node.js builtins — enforced by design, not tooling. No `@cinatra-ai/*` imports allowed.

---

*Convention analysis: 2026-06-09*
