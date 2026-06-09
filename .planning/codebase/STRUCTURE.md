# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
apollo-prospecting-agent/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: runs extension-kind-gate.mjs
│       └── release.yml     # Release workflow
├── cinatra/
│   └── oas.json            # OAS Flow definition (start → prospect → end)
├── skills/
│   └── apollo-prospecting-agent/
│       └── SKILL.md        # LLM system prompt (step-by-step agent instructions)
├── src/
│   └── index.ts            # TypeScript package stub (metadata constant only)
├── extension-kind-gate.mjs # CI validation script (agent + workflow kind gates)
├── package.json            # Package manifest (cinatra.kind: "agent")
├── tsconfig.json           # TypeScript configuration
├── .npmrc                  # npm registry configuration
└── LICENSE                 # Apache-2.0
```

## Directory Purposes

**`cinatra/`:**
- Purpose: Cinatra platform artifacts — the OAS flow definition that the runtime loads
- Contains: `oas.json` — the complete three-node flow (StartNode, ApiNode, EndNode) with all input/output schemas and data-flow/control-flow edges
- Key files: `cinatra/oas.json`

**`skills/apollo-prospecting-agent/`:**
- Purpose: LLM system prompt package, discovered by the Cinatra bridge via `agent_id`
- Contains: `SKILL.md` — natural-language step-by-step instructions covering the 6-step prospecting workflow, tool call sequences, hard caps, and forbidden actions
- Key files: `skills/apollo-prospecting-agent/SKILL.md`

**`src/`:**
- Purpose: TypeScript source for the npm package; provides `main`/`types` resolution
- Contains: A single typed stub file; no runtime logic
- Key files: `src/index.ts`

**`.github/workflows/`:**
- Purpose: GitHub Actions CI/CD pipelines
- Contains: `ci.yml` (runs `node extension-kind-gate.mjs --package-root .`), `release.yml`

## Key File Locations

**Entry Points:**
- `cinatra/oas.json`: OAS flow — the actual runtime entry point consumed by the Cinatra platform
- `src/index.ts`: npm package entry (TypeScript `main`/`types` only)

**Configuration:**
- `package.json`: Package name `@cinatra-ai/apollo-prospecting-agent`, `cinatra.kind: "agent"`, `cinatra.apiVersion: "cinatra.ai/v1"`
- `tsconfig.json`: TypeScript compiler settings
- `.npmrc`: npm registry (existence noted; contents not read)

**Core Logic:**
- `skills/apollo-prospecting-agent/SKILL.md`: All business logic — step-by-step LLM instructions
- `cinatra/oas.json`: Flow wiring (which LLM, which endpoint, what data moves where)

**CI Gate:**
- `extension-kind-gate.mjs`: Self-contained Node.js script; validates `cinatra/oas.json` for banned CRM primitives in LLM-visible fields; zero external dependencies

## Naming Conventions

**Files:**
- OAS flow: `cinatra/oas.json` (fixed path; the Cinatra runtime expects this exact location)
- Skill file: `skills/<agent-id>/SKILL.md` (directory name matches the `agent_id` registered in the OAS)
- Package stub: `src/index.ts` (conventional `src/index` entry)
- CI gate: `extension-kind-gate.mjs` (fixed name; extracted by the monorepo's extraction script)

**Directories:**
- `cinatra/` — always lowercase; holds platform-consumed artifacts
- `skills/<agent-id>/` — slug matches the `agent_id` in the OAS `data` block of the ApiNode

**Package naming:**
- npm scoped name: `@cinatra-ai/<slug>-agent` (e.g. `@cinatra-ai/apollo-prospecting-agent`)
- `cinatra.kind` in `package.json` must be `"agent"` for this pattern

## Where to Add New Code

**Changing agent behavior (tool call sequences, field mappings, caps):**
- Edit: `skills/apollo-prospecting-agent/SKILL.md`

**Adding or changing flow inputs/outputs:**
- Edit: `cinatra/oas.json` — update StartNode inputs, EndNode outputs, ApiNode I/O, and all data-flow edges in `data_flow_connections`

**Changing the LLM provider or model:**
- Edit: `cinatra/oas.json` — `metadata.cinatra.llm` (flow-level) and `data.cinatra_llm` (ApiNode-level)

**Adding a new Cinatra tool the LLM may call:**
- Document the tool in `skills/apollo-prospecting-agent/SKILL.md`; ensure the tool is available via the Cinatra self-MCP (no code change required in this repo)

**TypeScript types / package metadata:**
- Edit: `src/index.ts` for constants; `package.json` for manifest fields

**CI gate rules (banned primitives list):**
- Edit: `extension-kind-gate.mjs` — `BANNED_PRIMITIVES` and `BANNED_TYPEHINTS` arrays

## Special Directories

**`cinatra/`:**
- Purpose: Platform artifact directory consumed by the Cinatra runtime
- Generated: No (hand-authored)
- Committed: Yes

**`skills/`:**
- Purpose: LLM skill packages; the Cinatra bridge discovers `SKILL.md` files here by `agent_id`
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-06-09*
