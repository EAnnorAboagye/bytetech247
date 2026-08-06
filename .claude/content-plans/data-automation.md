# Content Plan — Data Automation

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar

**Cloudflare's July 2026 API Deprecation Wave: What Breaks in Automated Pipelines**

- Status: written
- Slug: -
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
