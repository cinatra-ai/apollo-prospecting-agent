# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**People Search / Sales Intelligence:**
- Apollo.io — primary data source for discovering people by company domain and job title
  - Tool: `apollo_people_search({ organizationDomains, personTitles, perPage })` — invoked once per domain; hard-capped at `perPage: 25`
  - Tool: `apollo_administration_get({})` — connectivity pre-check; aborts the run if `connected !== true`
  - Auth: managed by the Cinatra platform (Apollo connection stored as a user integration; no API key handled in this repo)
  - Docs: `skills/apollo-prospecting-agent/SKILL.md` (Steps 1 and 3)

**Cinatra LLM Bridge:**
- Cinatra `/api/llm-bridge` — the agent's single HTTP endpoint; the OAS `ApiNode` POSTs to `{{CINATRA_BASE_URL}}/api/llm-bridge`
  - Defined in: `cinatra/oas.json` (`prospect` node, `url` field)
  - Payload fields: `agent_id`, `system`, `user`, `agent_run_id`, `cinatra_llm`
  - Preferred provider: `openai`, preferred model: `gpt-5.5`

## Data Storage

**Databases:**
- CRM (provider-agnostic via Cinatra CRM facade) — accounts and contacts are persisted through the following tools:
  - `crm_account_search({ query })` — find existing account by domain
  - `crm_account_create({ name, domainName, apolloOrganizationId? })` — create new account
  - `crm_account_update({ id, patch })` — enrich existing account with Apollo org id
  - `crm_contact_create({ name, email?, linkedinUrl?, title?, accountId, apolloPersonId? })` — persist each discovered contact (no server-side dedup)
  - `crm_list_member_add({ listId, objectId, objectType })` — append contact to a CRM list (idempotent at facade level)
  - CRM provider examples: Twenty (noted in `SKILL.md` as using `searchName` for account search)
  - Connection: managed by the Cinatra platform; no connection strings in this repo

**File Storage:**
- Not applicable

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Cinatra platform — manages all external service connections (Apollo, CRM provider). This agent does not handle OAuth flows, API keys, or tokens directly. The self-MCP injection (auto-discovered toolbox) provides authenticated tool access at runtime.

## Monitoring & Observability

**Error Tracking:**
- Structured failures array — every tool-call error is appended to a `failures[]` array in the output JSON envelope rather than throwing; the run always completes. See `SKILL.md` Steps 2–5 for per-step failure handling.

**Logs:**
- Platform-managed; no explicit logging in agent code

## CI/CD & Deployment

**Hosting:**
- Cinatra AI platform (cloud-managed)

**CI Pipeline:**
- GitHub Actions — `.github/workflows/ci.yml`
  - `build` job: Node 24, corepack pnpm, dependency-shape validation, conditional install/typecheck/test, `npm pack --dry-run`
  - `kind-gates` job: runs `extension-kind-gate.mjs --package-root .` to validate `cinatra/oas.json` agent surface for retired primitives
- Release pipeline: `.github/workflows/release.yml` (present; contents not read)

## Environment Configuration

**Required env vars:**
- `CINATRA_BASE_URL` — injected by the Cinatra platform at runtime into the OAS flow; not an env var in this repo but a template variable in `cinatra/oas.json`

**Secrets location:**
- All secrets (Apollo credentials, CRM credentials, LLM API keys) are managed by the Cinatra platform. No secret files are present in this repo.

## Webhooks & Callbacks

**Incoming:**
- Not applicable — this is a stateless leaf agent invoked synchronously by the Cinatra orchestrator

**Outgoing:**
- Not applicable — all external calls are synchronous tool invocations via the Cinatra self-MCP

---

*Integration audit: 2026-06-09*
