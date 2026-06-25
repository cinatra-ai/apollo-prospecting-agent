# Apollo Prospecting Agent

Find target contacts at named companies and grow your CRM in one pass. Hand the agent a list of company websites and the job titles you want to reach, and it discovers matching people through Apollo, files them as contacts against the right company account, and optionally adds them to a list ready for outreach. Each company account is matched before it is created so accounts stay unique; contacts are saved as new records on every run, so re-running over the same companies can create duplicates — clean these up in your CRM after. Requires an Apollo integration connected in Cinatra and a CRM integration (such as Twenty) providing the `crm_*` tools.

## Works with

- Apollo (people-search and connectivity check)
- Any CRM integration that provides the `crm_account_*`, `crm_contact_create`, and `crm_list_member_add` tools (for example, Twenty)

## Capabilities

- Discover decision-makers at a list of target companies by job title using Apollo people-search
- Accept `organizationDomains` (required), `titlePatterns` (default: CEO, CTO, VP Engineering, Head of Sales), `maxPersons` (default: 10, hard cap: 25), and `listId` (optional) as inputs
- Create or match a CRM account for each company domain before saving contacts — `crm_account_create` does not deduplicate server-side, so it searches first
- Save discovered people as contacts attached to the matched account via `crm_contact_create`; each contact carries name, email, LinkedIn URL, title, and Apollo person id when available
- Append new contacts to the CRM list you nominate via `listId` for immediate follow-up campaigns
- Return a structured JSON summary: `{ accountIds, contactIds, apolloHitCount, addedToList, failures }`
- Fail gracefully per-domain and per-contact: errors go into `failures[]` and the run continues; a missing Apollo connection aborts early with a clear failure entry
- Run in isolation as a stateless leaf agent — it does not dispatch sub-agents and makes no external calls beyond Apollo and the CRM facade
