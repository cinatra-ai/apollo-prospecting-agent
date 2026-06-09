<!-- refreshed: 2026-06-09 -->
# Architecture

**Analysis Date:** 2026-06-09

## System Overview

```text
┌────────────────────────────────────────────────────────────────┐
│                  Caller / Orchestrator Agent                    │
│   (organizationDomains, titlePatterns, maxPersons, listId)      │
└──────────────────────────┬─────────────────────────────────────┘
                           │ POST /api/llm-bridge
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                  Cinatra Runtime (OAS Flow)                     │
│              `cinatra/oas.json`  (start → prospect → end)      │
│   LLM: OpenAI gpt-5.5  via ApiNode "Prospect via Apollo"       │
└──────────────────────────┬─────────────────────────────────────┘
                           │ tool calls (Cinatra self-MCP)
           ┌───────────────┼───────────────────────────┐
           ▼               ▼                           ▼
   ┌───────────────┐ ┌──────────────────┐  ┌──────────────────────┐
   │ Apollo tools  │ │  CRM Account     │  │  CRM Contact / List  │
   │ apollo_admin  │ │  crm_account_    │  │  crm_contact_create  │
   │ _get          │ │  search/create/  │  │  crm_list_member_add │
   │ apollo_people │ │  update          │  └──────────────────────┘
   │ _search       │ └──────────────────┘
   └───────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────┐
│  Output JSON: {accountIds, contactIds, apolloHitCount,          │
│               addedToList, failures}                            │
└────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| OAS Flow definition | Declares the three-node flow (start, prospect, end), inputs/outputs, and data-flow edges | `cinatra/oas.json` |
| SKILL.md (system prompt) | Step-by-step LLM instructions for the stateless agent | `skills/apollo-prospecting-agent/SKILL.md` |
| Typed entry point | Package `main`/`types` resolution stub; not imported at runtime | `src/index.ts` |
| Extension kind gate | CI gate: validates `cinatra/oas.json` for banned CRM primitives; validates workflow BPMN shape for workflow-kind packages | `extension-kind-gate.mjs` |

## Pattern Overview

**Overall:** OAS-driven stateless leaf agent

**Key Characteristics:**
- The agent has no application runtime of its own. The Cinatra platform reads `cinatra/oas.json`, constructs the flow (StartNode → ApiNode → EndNode), and drives execution.
- The single ApiNode (`prospect`) calls `POST /api/llm-bridge` with an `agent_id`. The bridge auto-discovers `SKILL.md` via the `agent_id` and injects Cinatra's self-MCP toolbox so the LLM can call Apollo and CRM tools.
- All business logic lives in `skills/apollo-prospecting-agent/SKILL.md` as natural-language instructions. No imperative application code executes.
- The agent is stateless (no persistence between invocations) and leaf (does not dispatch child agents).
- Hard cap: `maxPersons` clamped to 25 (Apollo `perPage` limit).

## Layers

**Flow Definition Layer:**
- Purpose: Declares inputs, outputs, nodes, and data-flow/control-flow edges for the Cinatra runtime
- Location: `cinatra/oas.json`
- Contains: StartNode, ApiNode (prospect), EndNode; data-flow edges wiring every input through to the LLM call and every output back to the caller
- Depends on: Cinatra runtime (external)
- Used by: Cinatra marketplace / orchestrator

**System Prompt Layer:**
- Purpose: Provides step-by-step instructions the LLM follows at runtime (6 steps: connectivity check, account upsert, Apollo search, contact create, list add, output)
- Location: `skills/apollo-prospecting-agent/SKILL.md`
- Contains: Tool call sequences, field mappings, error-handling rules, hard caps, forbidden actions
- Depends on: Cinatra self-MCP toolbox (injected at runtime by the bridge)
- Used by: LLM inside the `prospect` ApiNode

**TypeScript Package Stub:**
- Purpose: Provides `main`/`types` for npm/module resolution; exports a metadata constant only
- Location: `src/index.ts`
- Contains: `apolloProspectingAgent` constant (packageName, apiVersion, kind)
- Depends on: Nothing (no imports)
- Used by: Tooling/type consumers; not loaded at runtime

**CI Gate:**
- Purpose: Pre-publish sanity validation for extracted extension repos
- Location: `extension-kind-gate.mjs`
- Contains: Agent-kind gate (scans `cinatra/oas.json` for banned CRM primitives) and workflow-kind gate (validates BPMN shape)
- Depends on: Node.js builtins only (zero external dependencies)
- Used by: `.github/workflows/ci.yml`

## Data Flow

### Primary Request Path

1. Caller supplies `organizationDomains`, `titlePatterns`, `maxPersons`, `listId` to the Cinatra flow (`cinatra/oas.json` StartNode)
2. StartNode forwards all inputs via data-flow edges to the `prospect` ApiNode (`cinatra/oas.json` `$referenced_components.prospect`)
3. ApiNode POSTs to `{{CINATRA_BASE_URL}}/api/llm-bridge` with `agent_id: "apollo-prospecting-agent"` and a rendered user prompt
4. Bridge locates `SKILL.md`, injects self-MCP toolbox; LLM executes the 6-step tool-call sequence:
   - Step 1: `apollo_administration_get` — abort if not connected
   - Step 2 (per domain): `crm_account_search` → `crm_account_create` or `crm_account_update`
   - Step 3 (per domain): `apollo_people_search`
   - Step 4 (per person): `crm_contact_create`
   - Step 5 (per contact, if `listId` set): `crm_list_member_add`
5. LLM returns a single JSON envelope; bridge passes it back to the ApiNode
6. EndNode emits `accountIds`, `contactIds`, `apolloHitCount`, `addedToList`, `failures` to caller

**State Management:**
- Stateless. All intermediate state (domain→accountId map, running counts) lives in the LLM's in-context working memory for the duration of a single run. Nothing is persisted between runs.

## Key Abstractions

**CRM Facade:**
- Purpose: Provider-agnostic CRM access (Twenty or any other CRM the Cinatra platform supports); the agent never calls legacy `accounts_*`, `contacts_*`, `lists_*`, or `objects_*` primitives
- Pattern: All CRM mutations go through `crm_account_*`, `crm_contact_create`, `crm_list_member_add`

**Failures Array:**
- Purpose: Non-fatal error accumulator. Every tool failure appends a structured error object and execution continues. The run never aborts on a single failure.
- Pattern: `{ name, error, domain? }` objects collected throughout Steps 1–5 and returned in the final envelope

**Domain Normalization:**
- Purpose: Canonical form for matching CRM accounts by domain (strip protocol, www, path, trailing slash, lowercase)
- Location: Described in `SKILL.md` Step 2; executed by the LLM at runtime

## Entry Points

**OAS Flow Entry:**
- Location: `cinatra/oas.json` — `start_node: { $component_ref: "start" }`
- Triggers: Cinatra runtime invocation (marketplace, orchestrator, or direct API call)
- Responsibilities: Receives and validates `organizationDomains` (required), `titlePatterns`, `maxPersons`, `listId`, `cinatra_run_id`

**Package Entry (TypeScript):**
- Location: `src/index.ts`
- Triggers: Module import by tooling
- Responsibilities: Exports `apolloProspectingAgent` metadata constant only

## Architectural Constraints

- **Threading:** Not applicable — no application server. The Cinatra runtime manages concurrency.
- **Global state:** None. `src/index.ts` exports a plain object literal; `extension-kind-gate.mjs` is stateless.
- **Circular imports:** None (`src/index.ts` has no imports).
- **maxPersons cap:** Hard-capped at 25 per Apollo `apollo_people_search` schema; LLM silently clamps higher values.
- **No dedup:** `crm_contact_create` is a plain create. Repeated runs against the same domains produce duplicate contacts. Dedup is out of scope.

## Anti-Patterns

### Calling legacy CRM primitives

**What happens:** Using `accounts_create`, `contacts_list`, `lists_members_add`, etc. (the full banned list is enforced by `extension-kind-gate.mjs`)
**Why it's wrong:** These are retired; the Cinatra platform routes all CRM operations through the `crm_*` facade for provider abstraction
**Do this instead:** Use `crm_account_search`, `crm_account_create`, `crm_account_update`, `crm_contact_create`, `crm_list_member_add` as specified in `skills/apollo-prospecting-agent/SKILL.md`

### Creating an account without searching first

**What happens:** Calling `crm_account_create` for a domain before running `crm_account_search`
**Why it's wrong:** `crm_account_create` does not dedupe server-side; repeated calls create duplicate CRM accounts
**Do this instead:** Always run `crm_account_search({ query: websiteHost })` and post-filter for a domain match before deciding to create (`SKILL.md` Step 2)

### Dispatching other agents

**What happens:** Calling sub-agents or orchestrators from within this agent
**Why it's wrong:** This agent is declared leaf/stateless; it has no mechanism to dispatch and must not do so
**Do this instead:** Implement the full `source → normalize → store → act` loop inline using the 7 allowed Cinatra tools

## Error Handling

**Strategy:** Accumulate failures, never abort.

**Patterns:**
- Every tool call that throws appends a structured object to `failures[]`
- Apollo connectivity failure (Step 1) is the only early-abort path — all subsequent steps are skipped but the run still completes with empty arrays
- Single-domain or single-contact failures do not block other domains/contacts
- Final output always includes the `failures` array so callers can inspect partial results

## Cross-Cutting Concerns

**Logging:** Not applicable — no application code; the Cinatra runtime handles run-level observability
**Validation:** Input validation is handled by the Cinatra StartNode schema (e.g., `organizationDomains` is required); LLM clamps `maxPersons` to 25
**Authentication:** Apollo and CRM credentials are managed by the Cinatra platform's self-MCP injection; the agent never handles credentials directly

---

*Architecture analysis: 2026-06-09*
