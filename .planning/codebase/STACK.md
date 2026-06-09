# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript — agent entry point and type declarations (`src/index.ts`)
- JavaScript (ESM) — CI gate utility (`extension-kind-gate.mjs`)
- JSON — agent OAS spec and package manifest (`cinatra/oas.json`, `package.json`)

## Runtime

**Environment:**
- Node.js 24 (specified in `.github/workflows/ci.yml`)

**Package Manager:**
- pnpm (via corepack) — enforced in CI with `corepack enable` + `corepack pnpm`
- Lockfile: not committed (CI runs `--no-frozen-lockfile` for standalone repos)

## Frameworks

**Core:**
- Cinatra AI agent runtime (`cinatra.ai/v1`) — OAS-driven agent execution; the TypeScript entry point is a placeholder; actual execution is driven by `cinatra/oas.json` and `skills/apollo-prospecting-agent/SKILL.md`

**Testing:**
- Not applicable — this repo is a source mirror; tests are run inside the cinatra monorepo

**Build/Dev:**
- TypeScript compiler (`tsc`) — targets ES2023, ESNext modules, output to `dist/`
- No bundler detected

## Key Dependencies

**Critical:**
- `@cinatra-ai/*` packages — host-internal monorepo packages declared as optional `peerDependencies` only; never published to a registry. The cinatra monorepo provides them at workspace resolution time.

**Infrastructure:**
- No runtime npm dependencies in `package.json` (empty `dependencies` block)

## Configuration

**Environment:**
- `{{CINATRA_BASE_URL}}` — injected at runtime by the Cinatra platform into the OAS `ApiNode` URL (`cinatra/oas.json`, `prospect` node)
- `.env` file: not present in this repo; environment configuration is platform-managed

**Build:**
- `tsconfig.json` — standalone strict TypeScript config; targets `src/`, outputs to `dist/`; `moduleResolution: bundler`, `verbatimModuleSyntax: true`
- `.npmrc` — present (existence noted; contents not read)

## Platform Requirements

**Development:**
- Node.js 24+
- pnpm via corepack
- This repo is a source mirror — standalone install/typecheck/test are skipped when host-internal `@cinatra-ai/*` optional peers are declared; the cinatra monorepo is required for full development

**Production:**
- Deployed and executed by the Cinatra AI platform
- Agent runtime is OAS-driven: `cinatra/oas.json` (agentspec_version `26.1.0`) defines the flow; `skills/apollo-prospecting-agent/SKILL.md` is the system-prompt skill injected via `agent_id: "apollo-prospecting-agent"` through the Cinatra self-MCP bridge at `/api/llm-bridge`
- Preferred LLM: OpenAI `gpt-5.5` (declared in `cinatra/oas.json` metadata)

---

*Stack analysis: 2026-06-09*
