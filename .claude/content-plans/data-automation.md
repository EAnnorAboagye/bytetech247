# Content Plan — Data Automation

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar

**Cloudflare's July 2026 API Deprecation Wave: What Breaks in Automated Pipelines**

- Status: written
- Slug: cloudflares-july-2026-api-deprecation-wave
- Why pillar: Cloudflare's own official API deprecations tracker (`developers.cloudflare.com/fundamentals/api/reference/deprecations/`, backed by `cloudflare-docs`' `api-deprecations.yaml`) published 9 distinct, dated deprecation entries between 2026-05-13 and 2026-07-27, all inside the ~90-day freshness window and several within the last 2-4 weeks. Every entry is a REST API endpoint or field removal that silently breaks infrastructure scripts, Terraform configs, and CI pipelines calling Cloudflare's API directly, exactly the "pipeline/API/schema breaking change" structural profile `data-automation` targets, distinct from `dev-tools`' Wrangler-CLI-specific pillar (this covers the HTTP API layer any automation script or IaC tool calls, not the CLI). One cluster (Workers KV legacy namespace routes) is genuinely first-person dogfooded: this site's own `wrangler.toml` declares real KV bindings (`COUNTERS_KV`, `SESSION_KV`), so Wrangler itself calls the exact API surface being deprecated. The remaining clusters are honestly framed as the same Cloudflare account/platform surface any Cloudflare-hosted project's automation may call, not falsely claimed as run by this site's own scripts.

## Clusters

### 1. Cloudflare Deprecates Legacy Workers KV API Routes

- Status: written
- Slug: cloudflare-deprecates-legacy-workers-kv-api-routes
- Search Intent / Signal: `"The legacy Workers KV API routes under /accounts/{account_id}/workers/namespaces/* are deprecated"` — verbatim confirmed, from Cloudflare's official changelog.
- Structural Problem: Cloudflare is reorganizing storage APIs under a unified `/storage/` namespace (KV under `/storage/kv/`, R2 under `/storage/r2/`). The legacy `/workers/namespaces/*` routes still work today but stop on 2026-10-15; any infrastructure script, Terraform config, or CI pipeline calling the old path directly (not through Wrangler, which already handles this internally) breaks silently on that date with no code-level warning beforehand.
- Source: Cloudflare Changelog, "Deprecate legacy Workers KV namespace API routes," published 2026-07-15 (`developers.cloudflare.com/changelog/post/2026-07-15-kv-legacy-namespace-routes-deprecation/`)
- Interlinks: none yet (this repo's own `wrangler.toml` KV bindings are the dogfooded example)

### 2. Cloudflare Removes Zero Trust CIDR Route Endpoints

- Status: written
- Slug: cloudflare-removes-zero-trust-cidr-route-endpoints
- Search Intent / Signal: `"the CIDR-encoded route endpoints in the Zero Trust Networks API are removed"` — verbatim confirmed.
- Structural Problem: Automation that manages private network routing for Cloudflare Tunnel/WARP Connector via the CIDR-encoded route endpoints loses that API surface entirely on 2026-10-05, requiring migration to the current Zero Trust Networks route endpoints before then.
- Source: Cloudflare Changelog, "Zero Trust Networks route endpoints and Cloudflare Tunnel connections field retiring on October 5, 2026," published 2026-07-09 (`developers.cloudflare.com/changelog/post/2026-07-09-tunnel-routes-and-connections-api-changes/`)
- Interlinks: cluster 3 (same source post, distinct technical change)

### 3. Cloudflare Drops connections Field From Tunnel API

- Status: written
- Slug: cloudflare-drops-connections-field-from-tunnel-api
- Search Intent / Signal: `"the connections field is dropped from Cloudflare Tunnel and Cloudflare Mesh list and get responses"` — verbatim confirmed.
- Structural Problem: Automation parsing Cloudflare Tunnel or Mesh API list/get responses and reading a `connections` field off the JSON gets `undefined`/a missing key starting 2026-10-05, a schema change distinct from the route-endpoint removal in cluster 2 (same source post, same effective date, different technical surface: response schema vs. endpoint availability).
- Source: Cloudflare Changelog, "Zero Trust Networks route endpoints and Cloudflare Tunnel connections field retiring on October 5, 2026," published 2026-07-09 (`developers.cloudflare.com/changelog/post/2026-07-09-tunnel-routes-and-connections-api-changes/`)
- Interlinks: cluster 2 (same source post, distinct technical change)

### 4. Cloudflare Deprecates the Zone Settings Batch API

- Status: written
- Slug: cloudflare-deprecates-zone-settings-batch-api
- Search Intent / Signal: `"The Zone Settings Batch API endpoints, which read and edit multiple zone settings in a single request, are deprecated"` — verbatim confirmed.
- Structural Problem: Automation that reads or edits multiple zone settings in one batched request (`GET/PATCH /zones/{zone_id}/settings`) needs to migrate to per-setting endpoint calls; EOL is 2027-03-31, giving a long runway, but pipelines built against the batch shape need a genuine refactor, not a one-line fix.
- Source: Cloudflare Changelog, published 2026-07-27
- Interlinks: none yet

### 5. Cloudflare Now Enforces a 65-Char Account Name Limit

- Status: written
- Slug: cloudflare-enforces-65-char-account-name-limit
- Search Intent / Signal: `"Account names will be limited to a maximum of 65 characters across all account creation and update APIs"` — verbatim confirmed.
- Structural Problem: This is a new validation constraint, not an endpoint removal: automation that programmatically creates or renames Cloudflare accounts (`POST /accounts`, `PUT /accounts/{account_id}`) with a name over 65 characters, previously accepted, starts failing with a validation error once enforcement begins on 2026-09-27.
- Source: Cloudflare Changelog, published 2026-07-22
- Interlinks: none yet

### 6. Cloudflare Deprecates the foundation_dns DNS Setting

- Status: written
- Slug: cloudflare-deprecates-foundation-dns-setting
- Search Intent / Signal: `"The foundation_dns boolean is deprecated in the DNS settings endpoints for zone settings and account defaults"` — verbatim confirmed.
- Structural Problem: Automation toggling the `foundation_dns` boolean via `/zones/{zone_id}/dns_settings` or `/accounts/{account_id}/dns_settings` loses that field on 2026-11-23; the structural problem is finding what replaces it before scripts start silently no-op-ing on a field the API no longer honors.
- Source: Cloudflare Changelog, published 2026-07-27 (deprecation effective same day)
- Interlinks: none yet

### 7. Cloudflare Deprecates the Account Roles API

- Status: written
- Slug: cloudflare-deprecates-account-roles-api
- Search Intent / Signal: `"The Account Roles API only returns account-level roles today, and is deprecated in favor of the Permission Groups API"` — verbatim confirmed.
- Structural Problem: Automation calling `GET /accounts/{account_id}/roles` or `GET /accounts/{account_id}/roles/{role_id}` to enumerate or check permissions needs to migrate to the Permission Groups API, which has a genuinely different data model (fine-grained permission groups, not a flat role list), not a drop-in endpoint swap.
- Source: Cloudflare Changelog, published 2026-07-21 (deprecation effective same day)
- Interlinks: none yet

### 8. Cloudflare AMP/SXG API Has Reached End of Life

- Status: written
- Slug: cloudflare-amp-sxg-api-end-of-life
- Search Intent / Signal: `"The AMP/SXG features have reached end of life. There will be no replacement"` — verbatim confirmed.
- Structural Problem: Unlike the other clusters here, this one is retroactive: Cloudflare's own changelog entry, published 2026-07-08, documents a deprecation (2025-09-18) and EOL (2026-06-23) that already happened before the post went up. Automation calling `GET/PUT /zones/{zone_id}/amp/sxg` has been failing since late June with no changelog entry to explain why until this post appeared, a genuinely useful "why did this silently break weeks ago" angle distinct from the forward-looking deadline framing of every other cluster.
- Source: Cloudflare Changelog, published 2026-07-08 (documents a deprecation already in effect)
- Interlinks: none yet

### 9. Cloudflare Deprecates Legacy Registrar Domain API

- Status: written
- Slug: cloudflare-deprecates-legacy-registrar-domain-api
- Search Intent / Signal: `"The legacy Registrar domain management endpoints are deprecated and will reach their end of life on September 27, 2026"` — verbatim confirmed.
- Structural Problem: Automation managing domain registration/renewal via `GET/PUT /accounts/{account_id}/registrar/domains` loses that endpoint on 2026-09-27; domain-management automation is exactly the kind of low-frequency, easy-to-forget-about script that goes unmaintained until it starts failing.
- Source: Cloudflare Changelog, published 2026-06-29 (deprecation effective 2026-04-10)
- Interlinks: none yet

### 10. Cloudflare Deprecates Gateway Audit SSH Rules

- Status: written
- Slug: cloudflare-deprecates-gateway-audit-ssh-rules
- Search Intent / Signal: `"The Gateway Audit SSH action for network policies is deprecated"` — verbatim confirmed.
- Structural Problem: Similar retroactive shape to cluster 8: deprecated 2025-11-03, EOL already passed on 2026-07-15, with the corroborating changelog entry itself published 2026-05-13. Automation or Terraform-managed Gateway network policies referencing the Audit SSH action lose that capability; this is the fix-it-now angle for anyone whose policy-as-code pipeline started rejecting a config that used to apply cleanly.
- Source: Cloudflare Changelog, published 2026-05-13 (deprecation effective 2025-11-03, EOL 2026-07-15)
- Interlinks: none yet

# Pillar 2

## Pillar

**Zapier's 2026 Integration Deprecation Wave: What Breaks in Live Zaps**

- Status: written
- Slug: zapiers-2026-api-deprecation-wave
- Hub article: **Yes** — user approved a standalone hub, matching this category's existing pillar's precedent (`cloudflares-july-2026-api-deprecation-wave`).
- Why pillar: Zapier's own Help Center published four distinct, dated "action required"/"important update" advisories between 2026-05-29 and 2026-07-27 — Pipedrive V1 API (endpoints deprecate 2026-07-31), Zapier Functions (shuts down 2026-09-01), OpenAI Assistants API actions (stop working 2026-08-26), and Greenhouse's Harvest API v1/v2 (Zapier action required by 2026-08-26, Greenhouse-side sunset 2026-08-31) — plus a still-being-fixed HubSpot v1 Lists API sunset surfaced in Zapier's May 2026 community integrations digest. Each is a real third-party or first-party API/runtime sunset that silently breaks live Zaps: renamed/relabeled steps, missing response fields, dead auth flows, or shut-down code runtimes. This is the same "automation breaks silently when the API underneath it sunsets" structural shape as this category's first pillar (Cloudflare's API deprecation wave), but on a genuinely distinct layer: Zapier itself and the SaaS APIs it wraps, not Cloudflare's own REST API. **Honesty note:** bytetech247.com does not itself run Zapier — its own automation is Cloudflare Workers + GitHub Actions (see Pillar 1 above). Every cluster in this pillar must say so explicitly rather than implying first-person dogfooding; the justification here is structural (same breaking-change shape, different widely-used platform), not operational experience running these Zaps ourselves.
- Series value (frontmatter `series` for all 10 clusters + hub): `"Zapier's 2026 Integration Deprecation Wave: What Breaks in Live Zaps"`
- seriesOrder: hub = 1, clusters 1-10 below = 2 through 11 (following this repo's existing convention: see `cloudflares-july-2026-api-deprecation-wave` = 1, its 10 clusters = 2-11)
- Plan-numbering note: clusters below are numbered 11-20, continuing this file's running sequence from Pillar 1's 1-10, per the pillar-cluster skill's same-file continuation convention.

## Clusters (Pillar 2)

### 11. Fix Pipedrive Zaps Tagged [DEPRECATING JULY 31 2026]

- Status: written
- Slug: pipedrive-zaps-tagged-deprecating-july-31-2026
- Search Intent / Signal: `"[DEPRECATING JULY 31 2026]"` (literal marker Zapier prepends to affected step names) and `"Pipedrive is deprecating all V1 API endpoints on July 31, 2026"` — both verbatim confirmed, from Zapier's official Help Center article (updated 2026-05-29).
- Structural Problem: Pipedrive is retiring all V1 API endpoints on 2026-07-31 in favor of V2. Zapier has already renamed every affected trigger/action/search step in existing Zaps to prepend the literal string `[DEPRECATING JULY 31 2026]` to its name — but the step keeps running on the old API until a human opens the Zap, selects the same event name without the deprecation label in the Setup tab, and remaps fields in every downstream step. Nothing fails automatically before the deadline; the marker is purely cosmetic until acted on, which is exactly why it's easy to miss.
- Source: Zapier Help Center, "Action required: Update your Pipedrive workflows before the V1 API deprecation," updated 2026-05-29 (`help.zapier.com/hc/en-us/articles/44170499172237`)
- Interlinks: cluster 12 (same source article, distinct technical change — step relabeling/remapping vs. data loss)

### 12. Pipedrive V2 API Drops Fields Like deal_title

- Status: written
- Slug: pipedrive-v2-api-drops-fields-like-deal-title
- Search Intent / Signal: `"The V2 API returns less data than the V1 API"` and the article's own worked example — a Zap using the New Activity trigger mapping the `deal_title` field, "which is no longer available" — both verbatim confirmed, same source as cluster 11.
- Structural Problem: Unlike cluster 11's cosmetic relabeling, this is a genuine data-shape regression: Pipedrive's V2 API omits fields V1 exposed (e.g., `deal_title` on activity records). Remapping the step to the non-deprecated V2 event (per cluster 11) is not enough on its own — any downstream Filter, Formatter, or notification step that reads a now-missing field silently receives `undefined`/blank instead of erroring, so the Zap keeps "working" while producing wrong output. Fixing it structurally requires adding a lookup step (Pipedrive "Find Deal" search or a raw API Request call) to backfill the dropped field before it reaches downstream steps.
- Source: Zapier Help Center, "Action required: Update your Pipedrive workflows before the V1 API deprecation," updated 2026-05-29 (`help.zapier.com/hc/en-us/articles/44170499172237`)
- Interlinks: cluster 11 (same source article, distinct technical change)

### 13. Migrate Zapier Functions Python Code to fetch()

- Status: written
- Slug: migrate-zapier-functions-python-code-to-fetch
- Search Intent / Signal: `"Zapier Functions is being deprecated on September 1, 2026"` (verbatim confirmed) and `"Do not use fetch for these calls"` — Zapier's own warning about authenticated HTTP requests in the migration guide (verbatim confirmed, quoted with backticks in source). The `requests`→`fetch`, `print()`→`console.log()` mapping is paraphrased from the guide's before/after code samples, not a single quoted sentence.
- Structural Problem: Zapier Functions (Python-only, 5-minute max runtime, built on `requests`) shuts down entirely on 2026-09-01; the replacement, Code by Zapier, runs JavaScript or Python but on a different runtime that has no `requests` library — HTTP calls must be rewritten using `fetch`, except for _authenticated_ calls, which the docs explicitly say must go through API by Zapier with the Zapier SDK instead of `fetch`. A direct find-and-replace of `requests.get()` with `fetch()` silently breaks any authenticated call, which is the trap this cluster addresses.
- Source: Zapier Help Center, "Migrate from Zapier Functions to Code by Zapier," updated 2026-07-13 (`help.zapier.com/hc/en-us/articles/45230556598157`)
- Interlinks: clusters 14 and 15 (same source article, three distinct technical migration problems: HTTP/runtime port here, trigger topology in 14, credentials in 15)

### 14. Zapier Functions: Split Multi-Trigger Functions

- Status: written
- Slug: zapier-functions-split-multi-trigger-functions
- Search Intent / Signal: `"Each function trigger becomes a separate Zap trigger. If your function had multiple triggers, create one Zap per trigger or share code logic in a sub-Zap"` — verbatim confirmed, from the same Zapier Functions migration guide.
- Structural Problem: This is an architectural problem, not a code-syntax one: a single Zapier Function could expose multiple trigger events (e.g., one function file handling both "record created" and "record updated" logic). Code by Zapier has no equivalent — each Zap can only have one trigger — so a multi-trigger function has to be split into multiple separate Zaps, one per trigger event, with shared logic either duplicated across them or extracted into a callable sub-Zap. Skipping this step means only the first trigger event migrates and the others silently stop firing.
- Source: Zapier Help Center, "Migrate from Zapier Functions to Code by Zapier," updated 2026-07-13 (`help.zapier.com/hc/en-us/articles/45230556598157`)
- Interlinks: clusters 13 and 15 (same source article, distinct technical change)

### 15. Zapier Functions Secrets Move to API by Zapier

- Status: written
- Slug: zapier-functions-secrets-move-to-api-by-zapier
- Search Intent / Signal: the `connections['api_by_zapier']` binding syntax shown in the migration guide's before/after code sample is verbatim confirmed (a literal code identifier from the docs); the framing that Code by Zapier disallows embedded credentials the way Functions allowed is paraphrased from the same guide, not a single quoted sentence.
- Structural Problem: Zapier Functions let you hardcode API keys and tokens directly in the Python source. Code by Zapier's execution model doesn't support embedded secrets the same way — credentials have to be moved into an API by Zapier connection and referenced in code via `connections['api_by_zapier']` (matched to the connection's Account ID Variable), which is a genuine re-architecture of how the function authenticates outbound calls, not a syntax swap. A function copy-pasted into a Code step with its old hardcoded key left in place either fails outright or, worse, leaves a live credential sitting in plaintext inside a Zap step.
- Source: Zapier Help Center, "Migrate from Zapier Functions to Code by Zapier," updated 2026-07-13 (`help.zapier.com/hc/en-us/articles/45230556598157`)
- Interlinks: clusters 13 and 14 (same source article, distinct technical change)

### 16. Fix ChatGPT Conversation With Assistant Migration

- Status: written
- Slug: fix-chatgpt-conversation-with-assistant-migration
- Search Intent / Signal: `"On August 26, 2026, Zaps using these actions will stop working. If your Zaps use any of the affected actions, review or update them before that date"` — verbatim confirmed, from Zapier's ChatGPT deprecation notice (updated 2026-07-20). The detail that auto-migrated Zaps are left turned off pending review is paraphrased from the same article, not a single quoted sentence.
- Structural Problem: OpenAI is deprecating the Assistants API; Zapier auto-migrates any Zap using the "Conversation With Assistant (Legacy)" action to a new "Conversation" action built on the Responses API. But the migrated Zap is switched off, not just relabeled — it stays off until someone opens it, confirms the new Conversation action is configured correctly, remaps fields in any steps that read the old action's output shape, and manually re-enables it. A Zap that was "automatically migrated" weeks ago can still be sitting silently disabled today with no separate alert once the initial migration notice scrolls past.
- Source: Zapier Help Center, "Important update: ChatGPT users – OpenAI Assistants API deprecation," updated 2026-07-20 (`help.zapier.com/hc/en-us/articles/44865998484365`)
- Interlinks: cluster 17 (same source article, distinct technical change — auto-migrated action vs. manual rebuild)

### 17. Rebuild ChatGPT Create Assistant Zaps by Aug 26

- Status: written
- Slug: rebuild-chatgpt-create-assistant-zaps
- Search Intent / Signal: `"no direct replacement"` — verbatim confirmed phrase describing Create Assistant, Upload File, Find Assistant, and Find or Create Assistant in Zapier's deprecation notice; the affected action names themselves are also quoted verbatim in the source.
- Structural Problem: Unlike the Conversation action in cluster 16, four other ChatGPT actions (Create Assistant, Upload File when used with assistants, Find Assistant, Find or Create Assistant) get no automatic migration path at all because the Responses API has no equivalent concept of a persistent, server-side "Assistant" object to map onto. Zaps using these actions have to be redesigned from scratch around the Responses API's Conversation or Send Prompt actions — a rebuild, not a remap — before 2026-08-26, or they simply stop running with no fallback.
- Source: Zapier Help Center, "Important update: ChatGPT users – OpenAI Assistants API deprecation," updated 2026-07-20 (`help.zapier.com/hc/en-us/articles/44865998484365`)
- Interlinks: cluster 16 (same source article, distinct technical change)

### 18. Reconnect Greenhouse Zaps to OAuth 2.0 by Aug 26

- Status: written
- Slug: reconnect-greenhouse-zaps-to-oauth-2-0
- Search Intent / Signal: `"Zapier is releasing Greenhouse version 2.0.0, which uses Harvest v3 and OAuth 2.0 authentication"` and `"Click Reconnect to connect your Greenhouse account using the new OAuth 2.0 flow"` — both verbatim confirmed, from Zapier's Greenhouse deprecation notice (published 2026-07-27).
- Structural Problem: Greenhouse is retiring Harvest API v1 and v2 on 2026-08-31 (Zapier sets its own action deadline of 2026-08-26). The replacement Greenhouse app version (2.0.0) doesn't just call a different endpoint — it authenticates differently, via OAuth 2.0 instead of the API-key-based auth the old version used. Any Zap on the old version needs its Greenhouse connection actively reconnected through the new OAuth flow before promotion, or every step using that connection fails on the auth layer regardless of whether the step itself was otherwise migrated.
- Source: Zapier Help Center, "Action required: Update your Greenhouse Zaps before the Harvest API deprecation," published 2026-07-27 (`help.zapier.com/hc/en-us/articles/47585848967437`)
- Interlinks: cluster 19 (same source article, distinct technical change — auth flow vs. field/schema remap)

### 19. Fix Greenhouse Zaps for Harvest v3 Field Changes

- Status: written
- Slug: fix-greenhouse-zaps-for-harvest-v3-field-changes
- Search Intent / Signal: the affected-steps list — triggers `"New Candidate Application," "New Job Post," "Candidate Hired," "New Scheduled Interview," "Job Updated," "New Scorecard Due"`; actions `"API Request (Beta)," "Create Candidate Note," "Create Candidate," "Create Prospect," "Update Candidate"`; searches `"Find Candidate," "Find Due Scorecard"` — and the instruction `"If you use the API Request action or custom action, you must migrate your request to the Harvest v3 API"` — all verbatim confirmed, same source as cluster 18.
- Structural Problem: Distinct from the auth-layer problem in cluster 18, this is a payload/schema problem: even after reconnecting via OAuth 2.0, every one of the listed triggers, actions, and searches (plus any raw API Request or custom action calling the Harvest API directly) has to be individually checked against its new v3 field names and response shape, since Zapier's notice gives no single marker string (unlike Pipedrive's bracketed label) — the only way to find affected steps is to manually cross-reference each Zap's step names against this list.
- Source: Zapier Help Center, "Action required: Update your Greenhouse Zaps before the Harvest API deprecation," published 2026-07-27 (`help.zapier.com/hc/en-us/articles/47585848967437`)
- Interlinks: cluster 18 (same source article, distinct technical change)

### 20. Fix HubSpot Add Contact to List After V1 Sunset

- Status: written
- Slug: fix-hubspot-add-contact-to-list-after-v1-sunset
- Search Intent / Signal: `"Add Contact to List / Remove Contact from List: Actions using deprecated v1 Lists API sunset April 30 2026"` — verbatim confirmed, from Zapier Community's official monthly integrations digest (published 2026-05-28). **Freshness caveat, stated honestly:** both the sunset date (2026-04-30) and the corroborating post date (2026-05-28) fall slightly before this plan's strict ~2026-06-14 freshness window — the same retroactive shape as this file's Pillar 1 clusters 8 and 10 (Cloudflare AMP/SXG and Gateway SSH), which used a corroborating source published 2026-07-08 and 2026-05-13 respectively for already-past deprecation dates. The justification here is the same: this HubSpot break is old enough to have already happened, but recent enough (and un-flagged by any dedicated Help Center "action required" article, unlike Pipedrive/Greenhouse/ChatGPT/Functions) that people are plausibly still discovering silently-broken list-management Zaps months later with no single canonical Zapier advisory to find by searching.
- Structural Problem: HubSpot retired its v1 Lists API; Zapier's "Add Contact to List" and "Remove Contact from List" actions built against it stopped working 2026-04-30. Unlike Pipedrive/Greenhouse/ChatGPT/Functions, there is no dedicated Zapier Help Center "action required" article for this one — the only Zapier-side documentation is a single line in a monthly community digest, buried among dozens of unrelated feature-add bullet points, which is itself part of the structural problem: nothing surfaces this to an affected user proactively, so the Zap just silently stops adding/removing contacts from lists with no admin-facing warning.
- Source: Zapier Community, "What's New: 73 updated integrations for May 2026," published 2026-05-28 (`community.zapier.com/product-updates/what-s-new-73-updated-integrations-for-may-2026-53403`)
- Interlinks: none yet
