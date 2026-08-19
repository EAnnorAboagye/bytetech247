# Content Plan — AI Productivity

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar

**The MCP 2026-07-28 Spec Rewrite: What Breaks in Your Servers and Clients**

- Status: written
- Slug: mcp-2026-07-28-spec-rewrite
- Why pillar: The Model Context Protocol's 2026-07-28 specification, published 2026-07-28 (9 days before this research), is a genuinely comprehensive rewrite: a stateless protocol core, removed session handling, a new required server RPC, a replaced subscription mechanism, moved/removed protocol methods, and multiple feature-level deprecations (Roots, Sampling, Logging, Dynamic Client Registration). Sourced directly from the official MCP specification changelog (`modelcontextprotocol.io/specification/2026-07-28/changelog`), which lists far more than 10 distinct, verbatim, non-overlapping technical changes, no stretching required. This is directly dogfooded: this exact session runs on Claude Code, connected to multiple real MCP servers (GitHub, Cloudflare, Slack, and others), so every cluster describes a protocol this environment's own tooling actually speaks. The existing `prompting-guide-ai-coding-assistants` post covers prompting technique, not protocol mechanics, so there's no collision.

## Clusters

### 1. MCP Removes Protocol-Level Sessions (Mcp-Session-Id)

- Status: written
- Slug: mcp-removes-protocol-level-sessions
- Search Intent / Signal: `"Eliminated Mcp-Session-Id header from Streamable HTTP transport; list endpoints no longer vary per-connection; servers use explicit handles for cross-call state"` — verbatim confirmed.
- Structural Problem: Servers that relied on the `Mcp-Session-Id` header for sticky routing or per-connection state lose that mechanism entirely. Cross-call state now requires explicit, server-minted handles passed as ordinary tool arguments (tracked under SEP-2567), a genuine architecture change for any server holding connection-scoped state, not a header rename.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet (this session's own MCP servers are the real-world example)

### 2. MCP Replaces initialize Handshake With _meta Fields

- Status: written
- Slug: mcp-replaces-initialize-handshake-with-meta-fields
- Search Intent / Signal: `"Removed initialize/notifications/initialized handshake; requests now carry protocol version and capabilities in _meta (io.modelcontextprotocol/protocolVersion, io.modelcontextprotocol/clientCapabilities); version mismatches return UnsupportedProtocolVersionError"` — verbatim confirmed.
- Structural Problem: Any client or server that gates its behavior on a completed `initialize` handshake needs a structural rewrite: protocol version and capability negotiation happens per-request now, via `_meta` fields, not once at connection start. Code that assumes "negotiate once, trust it for the rest of the session" no longer has a session to trust.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 1 (same stateless-core rewrite, distinct mechanism)

### 3. MCP Servers Must Now Implement server/discover

- Status: written
- Slug: mcp-servers-must-implement-server-discover
- Search Intent / Signal: `"Added server/discover RPC: Servers must implement this to advertise their supported protocol versions, capabilities, and identity; clients may call before other requests"` — verbatim confirmed.
- Structural Problem: This is a new mandatory capability, not an optional add-on. Any existing MCP server implementation that predates this spec revision needs a new RPC handler added before a 2026-07-28-compliant client can safely negotiate with it, since there's no longer an `initialize` call to fall back on for that discovery.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 2 (the handshake this discovery mechanism replaces)

### 4. MCP Replaces SSE Subscriptions With subscriptions/listen

- Status: written
- Slug: mcp-replaces-sse-subscriptions-with-subscriptions-listen
- Search Intent / Signal: `"Introduced subscriptions/listen as a single long-lived POST-response stream for opted-in server-to-client change notifications; clients opt into specific types (toolsListChanged, promptsListChanged, resourcesListChanged, resourceSubscriptions)"` — verbatim confirmed.
- Structural Problem: The old model of a persistent SSE GET connection for server-initiated notifications is replaced by an opt-in, typed subscription model over a single POST stream. A client that assumed every notification type arrives automatically needs to explicitly request each type it cares about.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

### 5. MCP Removes the ping and logging/setLevel Methods

- Status: written
- Slug: mcp-removes-ping-and-logging-setlevel-methods
- Search Intent / Signal: `"Removed protocols: ping, logging/setLevel, notifications/roots/list_changed; log level now set per-request via io.modelcontextprotocol/logLevel in _meta"` — verbatim confirmed.
- Structural Problem: A client health-checking a server with `ping`, or setting log verbosity with `logging/setLevel`, has no direct replacement RPC for either; log level moves to a per-request `_meta` field instead of a standalone call, and there's no stated replacement for `ping` as a liveness check.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 9 (the broader Roots/Sampling/Logging feature deprecation, a distinct angle on adjacent territory)

### 6. MCP Moves Tasks Out of Core Into an Extension

- Status: written
- Slug: mcp-moves-tasks-out-of-core-into-extension
- Search Intent / Signal: `"Moved experimental tasks to official extension io.modelcontextprotocol/tasks; replaced blocking tasks/result with polling via tasks/get and new tasks/update"` — verbatim confirmed.
- Structural Problem: Long-running task tracking moves from an experimental core feature to a formal, separately-namespaced extension, and the interaction pattern changes from a blocking result call to explicit polling. Code written against the experimental `tasks/result` call needs both a namespace update and a control-flow rewrite to polling.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

### 7. MCP Requires resultType on Every Returned Result

- Status: written
- Slug: mcp-requires-resulttype-on-every-result
- Search Intent / Signal: `"All results now carry mandatory resultType: complete or input_required"` and `"Multi Round-Trip Requests (MRTR) pattern replaces server-initiated requests; servers return InputRequiredResult with resultType: input_required and inputRequests field"` — verbatim confirmed.
- Structural Problem: Every server response now needs an explicit `resultType` discriminator, and the old pattern of a server initiating a mid-call request to the client is replaced by the client recognizing `resultType: "input_required"` and handling `inputRequests` explicitly. A server or client built against the old implicit result shape breaks on both ends: sending results without the field, and not handling the new input-required branch.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

### 8. MCP Removes SSE Resumability (Last-Event-ID Gone)

- Status: written
- Slug: mcp-removes-sse-resumability
- Search Intent / Signal: `"Eliminated Last-Event-ID header and SSE event IDs; broken streams require re-issuing as new requests"` — verbatim confirmed.
- Structural Problem: A client that reconnects a dropped SSE stream using `Last-Event-ID` to resume from where it left off has no equivalent mechanism anymore; the correct behavior after a broken stream is now to re-issue the entire request as new, not resume in place, a real reliability-handling change for any client with retry/reconnect logic.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 4 (same transport layer, distinct reliability mechanism)

### 9. MCP Deprecates Roots, Sampling, and Logging

- Status: written
- Slug: mcp-deprecates-roots-sampling-and-logging
- Search Intent / Signal: `"Roots, Sampling, and Logging features deprecated; suggested migrations provided"` — verbatim confirmed. Deprecated, not yet removed: the spec's own governance policy guarantees a minimum twelve-month window before removal.
- Structural Problem: Unlike the Major Changes above, which are already-effective breaking changes, this is a deprecation notice with a runway: any server or client built on these three feature areas keeps working today but is on a clock. The practical action is auditing which of the three a given implementation actually uses and planning the migration now, not waiting for a forced break.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 5 (the specific removed `ping`/`logging/setLevel` methods, a narrower, already-effective angle on adjacent territory)

### 10. MCP Deprecates OAuth Dynamic Client Registration

- Status: written
- Slug: mcp-deprecates-oauth-dynamic-client-registration
- Search Intent / Signal: `"OAuth 2.0 Dynamic Client Registration Protocol (RFC 7591) deprecated in favor of Client ID Metadata Documents"` — verbatim confirmed.
- Structural Problem: Any MCP client that dynamically registers itself with an authorization server via RFC 7591 DCR needs to plan a migration to Client ID Metadata Documents (CIMD) instead. This is an authorization-layer change distinct from every other cluster here, which are all core-protocol or transport changes.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

## Pillar 2

**The 2026 LLM Token & Pricing Reset: GPT-5.6, Claude Opus 4.8, Gemini 3.6**

- Status: written (2026-08-12)
- Slug: 2026-llm-token-pricing-reset
- Why pillar: Researched for, and built to interlink with, the newly-shipped `/tools/ai-token-counter/` page. Within the last ~90 days (research date 2026-08-11), all three major LLM providers shipped structural changes to context windows, tokenization, caching economics, or model lifecycle that directly change how many tokens a given prompt costs and what it's worth doing about it: GPT-5.6 went GA with a new 1.05M-token context window and an overhauled (no-longer-free) prompt-caching model; a wave of legacy OpenAI model IDs (gpt-4, o1, o4-mini) hit their real October 23, 2026 shutdown date; Claude Opus 4.8 shipped alongside a tokenizer (inherited from 4.7) that counts up to ~35% more tokens for the same input than pre-4.7 models, plus real breaking API-parameter changes; and Gemini 3.6 Flash launched with a meaningfully different token/cost profile than its predecessor. No existing post on this site covers token counting, context windows, or cross-provider pricing (confirmed against `src/content/blog/*/index.mdx` — the only ai-productivity content today is the MCP protocol pillar and a general prompting-technique guide), so there's no collision, and every cluster below is exactly the kind of "did my token math just change" question the token counter tool answers directly.
- Series: `2026-llm-token-pricing-reset`
- seriesOrder: continues the category's sequence at 11 (Pillar 1 used 1-10)
- Hub article: confirmed with user 2026-08-11 — yes, draft the pillar topic itself as a standalone hub article too (matches Pillar 1's precedent), linking out to all 10 clusters as they're written.

## Clusters (Pillar 2)

### 11. GPT-5.6's Context Window: 922K In, 128K Out Tokens

- Status: written (2026-08-12)
- Slug: gpt-5-6-context-window-922k-tokens
- Search Intent / Signal: GPT-5.6 (Sol/Terra/Luna) reached general availability with a 1.05M-token context window (up to 922K input, 128K output), using the o200k_base encoding shared with GPT-4o — paraphrased, aggregated across multiple 2026 model-tracking sites (Wikipedia's GPT-5.6 page, wavespeed.ai), not confirmed against OpenAI's own primary announcement post directly.
- Structural Problem: Existing integrations sized their context-management/chunking logic around older models' smaller windows (128K-200K for the GPT-4 family). A near-1M window changes the entire "when do I need to chunk/summarize" calculus, and the shared o200k_base encoding means token counts for GPT-5.6 differ from cl100k_base-based estimates (relevant caveat: this site's own AI Token Counter tool currently implements cl100k_base only, not o200k_base — a real, honest limitation worth surfacing in this cluster).
- Source: GPT-5.6 general availability, official API changelog date 2026-07-09 (per Wikipedia's GPT-5.6 entry, cross-referenced against wavespeed.ai's release-date tracking)
- Interlinks: cluster 20 (cross-provider cost comparison), `/tools/ai-token-counter/` (direct — the o200k_base caveat is exactly what the tool's own comparison table already discloses)

### 12. GPT-5.6 Ends Free Prompt-Cache Writes (1.25x Premium)

- Status: written (2026-08-12)
- Slug: gpt-5-6-prompt-cache-write-premium
- Search Intent / Signal: Moving to GPT-5.6 replaced OpenAI's free, implicit prompt caching with explicit cache breakpoints, a 1.25x cache-write premium, and a 30-minute minimum TTL, while cache reads keep the existing 90% discount — paraphrased, sourced to third-party cost-analysis coverage (effloow.com), not OpenAI's own primary pricing docs directly.
- Structural Problem: Any integration that relied on OpenAI's previous "caching just happens, for free" model needs to add explicit cache-breakpoint configuration to keep getting a discount at all, and needs to budget for the new write-side cost that didn't exist before — a real code change, not just a number to note.
- Source: effloow.com prompt-cache cost analysis, tied to GPT-5.6 GA (2026-07-09)
- Interlinks: cluster 13 (cache retention extension), cluster 19 (OpenAI vs Anthropic caching comparison)

### 13. OpenAI Extends Prompt Cache Retention to 24 Hours

- Status: written (2026-08-12)
- Slug: openai-prompt-cache-24-hour-retention
- Search Intent / Signal: OpenAI changed the default prompt-cache lifetime from a few minutes to up to 24 hours — paraphrased, sourced to effloow.com's measured cache-retention analysis.
- Structural Problem: Workflows that assumed a short cache window (and either didn't bother structuring prompts for cache hits, or worked around the short TTL some other way) can now restructure around a genuinely all-day cache lifetime — a real architecture decision for any agent/pipeline making repeated calls with a shared prefix.
- Source: effloow.com, dated 2026-05-29
- Interlinks: cluster 12 (the same caching overhaul), cluster 19

### 14. gpt-4, o1, and o4-mini Shut Down October 23, 2026

- Status: written (2026-08-12)
- Slug: gpt-4-o1-o4-mini-shutdown-october-2026
- Search Intent / Signal: `"Unless safety or compliance concerns require a faster timeline, we provide the following minimum notice periods before model retirement: Generally available models: At least 6 months."` — verbatim confirmed, fetched directly from OpenAI's own live deprecations page (developers.openai.com/api/docs/deprecations). That same page lists `gpt-4`/`gpt-4-0613`, `o1`/`o1-pro`, and `o4-mini` all shutting down 2026-10-23, with `gpt-5.6-sol` and `gpt-5.6-terra` as the named replacements, under the "2026-04-22: Legacy GPT model snapshots" notice.
- Structural Problem: After the shutdown date, API calls to these model IDs return errors instead of responses — not a soft deprecation warning, a hard cutover. Anyone still pointing at `gpt-4`, `o1`, or `o4-mini` needs a real migration to `gpt-5.6-sol`/`gpt-5.6-terra` before then, including re-checking token counts and costs against the new models' different tokenizer/pricing (direct tie to cluster 11).
- Source: OpenAI API deprecations page (developers.openai.com/api/docs/deprecations), notice dated 2026-04-22, shutdown 2026-10-23 — primary source, fetched directly
- Interlinks: cluster 11 (the replacement model's own context/token profile), `/tools/ai-token-counter/`

### 15. Claude Opus 4.8: Same Price, Cheaper Fast Mode

- Status: written (2026-08-12)
- Slug: claude-opus-4-8-fast-mode-pricing
- Search Intent / Signal: Claude Opus 4.8 launched at the same base pricing as Opus 4.7 ($5/$25 per MTok), but Fast Mode dropped from $30/$150 to $10/$50 per MTok — paraphrased, sourced to third-party pricing-tracking coverage (finout.io), not Anthropic's own pricing page directly.
- Structural Problem: Anyone who priced out Fast Mode against Opus 4.7 and decided it was too expensive has a materially different cost equation now — a real re-evaluation, not just a footnote, especially for latency-sensitive workloads that specifically wanted Fast Mode.
- Source: finout.io Claude Opus 4.8 pricing breakdown, model launch dated 2026-05-28
- Interlinks: cluster 16 (the tokenizer this model inherited), cluster 20

### 16. Claude's New Tokenizer Counts Up to 35% More

- Status: written (2026-08-12)
- Slug: claudes-tokenizer-counts-up-to-35-percent-more
- Search Intent / Signal: Opus 4.7 shipped an updated tokenizer that counts roughly 1.0-1.35x (up to ~35%) more tokens for the same input text than Opus 4.6 — paraphrased, sourced to third-party technical coverage (byteiota.com, developersdigest.tech). Explicitly **not confirmed** against Anthropic's own official GA changelog: a direct fetch of the GitHub changelog announcing Opus 4.7's general availability (2026-04-16) contains no mention of tokenizer or token-count changes at all, only general performance claims — worth stating plainly rather than presenting third-party reporting as if it were primary-sourced.
- Structural Problem: Same pricing per token doesn't mean same cost per prompt — if the same text now tokenizes to more tokens, the effective cost per API call goes up even though the headline $/MTok rate didn't change. Anyone tracking a cost budget against token counts needs to re-baseline, not just re-check the price sheet. Confirmed still in effect as of Opus 4.8 (2026-05-28): the tokenizer did not change between 4.7 and 4.8, so this remains today's behavior, not a one-version blip.
- Source: byteiota.com and developersdigest.tech technical coverage of Opus 4.7 (tokenizer claim); GA date 2026-04-16 confirmed via GitHub's official changelog (github.blog/changelog/2026-04-16-claude-opus-4-7-is-generally-available), which does **not** itself mention the tokenizer change; persistence into 4.8 per finout.io's 2026-05-28 Opus 4.8 coverage
- Interlinks: cluster 15, cluster 20, `/tools/ai-token-counter/` (direct — this is precisely the "why exact counts matter" case for the tool)

### 17. Claude Opus 4.7 Breaks temperature and top_p Params

- Status: written (2026-08-12)
- Slug: claude-opus-4-7-breaks-temperature-top-p-params
- Search Intent / Signal: Opus 4.7 introduced breaking changes versus 4.6 where `budget_tokens` and the sampling parameters `temperature`/`top_p`/`top_k` all return HTTP 400 — paraphrased, sourced to third-party technical coverage, same caveat as cluster 16: not confirmed against Anthropic's own official GA changelog, which doesn't mention this.
- Structural Problem: Any client code passing these parameters (a common, previously-valid pattern) breaks outright on upgrade rather than degrading gracefully — a real, immediate integration fix, not a deprecation with runway.
- Source: Third-party Opus 4.7 technical coverage (same source cluster as 16); GA date 2026-04-16 per GitHub's official changelog (does not itself confirm this specific claim)
- Interlinks: cluster 16 (same release, distinct breaking-change angle)

### 18. Gemini 3.6 Flash Cuts Output Tokens 17%, Price Too

- Status: written (2026-08-12)
- Slug: gemini-3-6-flash-output-tokens-price-cut
- Search Intent / Signal: Gemini 3.6 Flash launched using 17% fewer output tokens than Gemini 3.5 Flash for comparable tasks, at $1.50/$7.50 per million input/output tokens with a 1M-token context window — paraphrased, sourced to 9to5google.com's launch coverage (a reputable, dated tech-press source, though not Google's own primary blog post).
- Structural Problem: A model that genuinely uses fewer output tokens per task changes the cost-per-task math independently of the per-token price — two separate levers moving at once (price per token, and tokens per task), which is easy to conflate if you're only comparing sticker prices across models.
- Source: 9to5google.com, "Google launches Gemini 3.6 Flash and 3.5 Flash-Lite," dated 2026-07-21
- Interlinks: cluster 20

### 19. OpenAI vs Claude: Prompt Caching Cost Math in 2026

- Status: written (2026-08-12)
- Slug: openai-vs-claude-prompt-caching-cost-math
- Search Intent / Signal: Synthesis cluster, not a single dated announcement — compares OpenAI's new explicit-breakpoint/1.25x-write-premium caching model (cluster 12) against Anthropic's existing cache-discount structure (up to 90% off cached input, no separate write premium documented), drawing on third-party cost-math coverage (ofox.ai).
- Structural Problem: The two providers' caching economics are no longer directly comparable on a single "discount %" axis now that OpenAI charges a write premium Anthropic doesn't — a developer picking a provider based on caching-friendliness needs to model both sides of the write/read cost, not just the advertised read discount.
- Source: ofox.ai prompt-caching cost-math comparison (2026); underlying facts from clusters 12-13
- Interlinks: cluster 12, cluster 13, `/tools/ai-token-counter/`

### 20. Same Prompt, Different Bill: GPT-5.6 vs Claude vs Gemini

- Status: written (2026-08-11)
- Slug: same-prompt-different-bill-gpt-claude-gemini
- Search Intent / Signal: Synthesis/closing cluster tying together clusters 11, 15, 16, and 18 — the same prompt now produces a different token count _and_ a different price on each of the three providers' current flagship models, a direct consequence of this whole pillar's changes landing in the same ~90-day window.
- Structural Problem: Cost comparisons that were done even a few months ago (before GPT-5.6, Opus 4.8, and Gemini 3.6 all shipped) are stale on two axes at once — token count per prompt and price per token both moved. This is the cluster explicitly designed to drive to, and be driven from, `/tools/ai-token-counter/` — the practical "check it yourself, don't trust a stale blog post's numbers" resource.
- Source: synthesis of clusters 11, 15, 16, 18 above
- Interlinks: cluster 11, cluster 15, cluster 16, cluster 18, `/tools/ai-token-counter/` (primary — this cluster is the direct content-to-tool bridge)

## Pillar 3

**GitHub Copilot's AI Credits Promo Cliff (Sept 1, 2026)**

- Status: written (2026-08-19)
- Slug: github-copilot-ai-credits-cliff-2026
- Why pillar: User-supplied Google Keyword Planner export showed "github copilot" pulling 500,000 avg. monthly searches (Low ad competition, -90% 3-month change — plausibly the pricing-shock backlash itself), cross-referenced against live research per `content-planner`'s CSV-cross-reference mechanism (logged `.claude/content-plans/discovered-keywords.md`, 2026-08-19 entry). GitHub's June 1, 2026 retirement of Premium Request Units in favor of "AI Credits" created promotional Business/Enterprise allowances (3,000/7,000 credits/user/mo) that revert to standard levels (1,900/3,900) on 2026-09-01 — a real, dated, hard deadline forcing admin action, with enough distinct structural ground underneath it (calculation mechanics, migration behavior, a separate annual-subscriber multiplier spike, budget controls, tier comparison, Agent Mode's cost profile) for 10 non-overlapping clusters. Checked against `src/content/blog/*/index.mdx` (grep for "copilot"/"Copilot") — zero collisions, this is genuinely new ground for the site.
- Series: `copilot-ai-credits-cliff-2026`
- seriesOrder: hub is 1, clusters are 2-11 (this pillar's own series starts fresh, distinct from this plan file's running cluster-number 21-30)
- Hub article: **Yes** — user approved a standalone hub (2026-08-19), matching every prior pillar's precedent on this site.

## Clusters (Pillar 3)

### 21. Check Your Copilot AI Credits Usage Before Sept 1

- Status: written (2026-08-19)
- Slug: check-copilot-ai-credits-usage-before-sept-1
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 2
- Search Intent / Signal: "Copilot users can now see AI credits used per billing cycle" — verbatim confirmed (changelog title, 2026-07-20); "AI credits consumed per user now in the Copilot usage metrics API" — verbatim confirmed (changelog title, 2026-06-19).
- Structural Problem: Before mid-2026, an individual's or org's real-time AI Credits consumption wasn't visible anywhere in the product. GitHub shipped three separate, stacked additions within about a month, an individual per-cycle usage view (2026-07-20), a per-user API field (2026-06-19), and an org-level "usage metrics impact dashboard" (2026-07-22), giving admins the actual visibility needed to see whether they're heading toward the Sept 1 cliff before it hits, not just budget controls to react after the fact. (Note: replaces this cluster's original angle, "the cliff itself, explained," which duplicated the hub article's own headline rather than adding a distinct sub-angle — caught before drafting started.)
- Proposed H1: `Check Your Copilot AI Credits Usage Before Sept 1`
- Source: github.blog changelog — "Copilot users can now see AI credits used per billing cycle" (2026-07-20), "AI credits consumed per user now in the Copilot usage metrics API" (2026-06-19), "New Copilot usage metrics impact dashboard" (2026-07-22); docs.github.com "Monitoring your GitHub AI Credits usage" (official, living doc)
- Interlinks: none yet — this is the pillar's own hub topic (the hub covers the cliff broadly; this cluster is the narrow, hands-on "check your own numbers" companion), cluster 25 (budget controls — usage visibility is the precondition for setting an informed budget)

### 22. How GitHub Copilot AI Credits Are Actually Priced

- Status: written (2026-08-19)
- Slug: github-copilot-ai-credits-pricing-explained
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 3
- Search Intent / Signal: "1 credit = $0.01 USD" — verbatim confirmed (official docs).
- Structural Problem: Credits replace flat per-request PRU multipliers with real per-token, per-model pricing (input/output/cache-write priced differently per model), which is why usage now scales with actual model choice and context size instead of a fixed per-request count the way PRUs did.
- Proposed H1: `How GitHub Copilot AI Credits Are Actually Priced`
- Source: docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing (official, living doc)
- Interlinks: `same-prompt-different-bill-gpt-claude-gemini`, `2026-llm-token-pricing-reset` (both cover per-token/per-model pricing mechanics for other providers — natural cross-link into this site's existing pricing-reset pillar)

### 23. GitHub Copilot's PRU to AI Credits Migration, Explained

- Status: written (2026-08-19)
- Slug: github-copilot-pru-to-ai-credits-migration
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 4
- Search Intent / Signal: "Updates to GitHub Copilot billing and plans" — verbatim confirmed (changelog title).
- Structural Problem: The June 1, 2026 cutover retired the Premium Request Unit multiplier system for monthly-billed Pro/Pro+/Business/Enterprise plans in favor of Credits — this cluster explains what actually changed under the hood (multiplier system removed) versus what stayed the same (per-model cost still varies, just priced in real token-based credits now instead of a flat multiplier).
- Proposed H1: `GitHub Copilot's PRU to AI Credits Migration, Explained`
- Source: github.blog changelog, "Updates to GitHub Copilot billing and plans" (2026-06-01)
- Interlinks: `2026-llm-token-pricing-reset` (hub of the site's existing pricing-reset pillar — this is the Copilot-specific instance of that same industry-wide pattern)

### 24. Annual Copilot Plans: Model Multipliers Just Spiked

- Status: written (2026-08-19)
- Slug: annual-copilot-plans-model-multipliers-spike
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 5
- Search Intent / Signal: the official model-multiplier table revision — verbatim confirmed; the "up to 27x" characterization of the table's extremes — paraphrased (a third-party read of the table, not a github.com quote).
- Structural Problem: Annual-plan subscribers were NOT migrated to Credits on June 1 — they stayed on the legacy PRU/multiplier system, but GitHub revised the multiplier table itself on that same date, so some models got dramatically more expensive in PRU terms for a subscriber population that can't access the new Credits system until renewal. Genuinely distinct mechanism from clusters 22-23, easy to conflate with the Credits migration but isn't the same change.
- Proposed H1: `Annual Copilot Plans: Model Multipliers Just Spiked`
- Source: docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/model-multipliers-for-annual-plans (official, living doc, revised 2026-06-01); levelup.gitconnected.com investigative piece
- Interlinks: cluster 23 (contrast — what monthly subscribers got instead)

### 25. Setting Copilot Budget Controls Before the Sept Cliff

- Status: written (2026-08-19)
- Slug: github-copilot-budget-controls-setup
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 6
- Search Intent / Signal: "Getting started with budget controls" — verbatim confirmed (official doc page title).
- Structural Problem: Orgs/enterprises can set budgets at org, cost-center, or per-user level. CORRECTED 2026-08-19 (the hub-drafting agent live-verified this against the real docs and found the plan's original "stop vs limit named modes" framing was wrong): it's a boolean toggle, "Stop usage when budget limit is reached," available on org/cost-center budgets — ON hard-blocks premium features once the budget is exceeded, OFF lets usage continue with charges accruing uncapped past the budget (notify-only). A universal per-user budget always hard-stops with no toggle. This is the actual lever an admin has to configure before Sept 1, not a passive dashboard.
- Proposed H1: `Setting Copilot Budget Controls Before the Sept Cliff`
- Source: docs.github.com/en/copilot/tutorials/budgets/getting-started-with-budget-controls (official, living doc — note: not the "-for-copilot" suffixed URL guessed in earlier research, that 404s)
- Interlinks: cluster 21 (checking usage is the precondition for setting an informed budget), cluster 30 (checklist)

### 26. What Happens When GitHub Copilot Credits Run Out

- Status: written (2026-08-19)
- Slug: what-happens-when-copilot-credits-run-out
- CORRECTION FOUND (2026-08-19): this cluster's own live verification found the hub article's exhaustion-default claim is wrong for Business/Enterprise — the real default is uncapped, automatic metered billing (additional usage enabled by default; charges accrue without a cap until an admin explicitly disables the AI credits paid usage policy or a budget stops it), not a safe halt. The hub needs a correction pass before publish.
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 7
- Search Intent / Signal: community-reported confusion across GitHub Community discussions #197557, #197605, #197089 — paraphrased (no single verbatim error string; the reported symptom is "premium features stop working").
- Structural Problem: CAUTION — the "default $0 overage budget" framing this entry originally used has NOT been independently live-verified, and cluster 25's own research needed a correction after live-checking the primary docs (the mechanism turned out to be a "Stop usage when budget limit is reached" toggle, not named "stop/limit" modes — see cluster 25 above). Before drafting this cluster, independently live-verify against docs.github.com/en/copilot/tutorials/budgets/* what actually happens with NO budget configured at all (as opposed to a budget configured with the toggle off) — don't assume the original framing is correct, confirm it against the current primary source the same way cluster 25's drafting agent did.
- Proposed H1: `What Happens When GitHub Copilot Credits Run Out`
- Source: docs.github.com budget docs (official) + GitHub Community discussions #197557, #197605, #197089
- Interlinks: cluster 25 (budget controls — this is what happens without one configured)

### 27. Why Copilot Agent Mode Burns Through Credits So Fast

- Status: written (2026-08-19)
- Slug: copilot-agent-mode-credits-consumption
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 8
- Search Intent / Signal: "~1,000x more tokens than a single-turn chat query" — paraphrased (GitHub's own research figure, as relayed by third-party coverage, not a directly quoted GitHub sentence).
- Structural Problem: Agent Mode's multi-step tool-calling loop (read file → edit → run tests → re-read → repeat) burns tokens per step, not per user message, so a single "fix this bug" agent session can consume credits at a rate a per-message mental model doesn't predict — explains real reported bill jumps ($29→$750, $50→$3,000/mo).
- Proposed H1: `Why Copilot Agent Mode Burns Through Credits So Fast`
- Source: daily.dev coverage citing GitHub's own research; corroborating third-party billing-shock reports
- Interlinks: cluster 22 (calculation mechanics), `prompting-guide-ai-coding-assistants` (site's existing general AI-coding-assistant guide)

### 28. GitHub Copilot Plans Compared by AI Credits, Not Price

- Status: written (2026-08-19)
- Slug: github-copilot-plans-compared-by-ai-credits
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 9
- Search Intent / Signal: exact figures — Free (completions + limited chat, no paid credits), Pro $10/mo=1,500 credits, Pro+ $39/mo=7,000 credits, Max $100/mo=20,000 credits, Business=1,900/user/mo pooled, Enterprise=3,900/user/mo pooled — verbatim confirmed (published pricing figures, cross-checked across official + third-party trackers).
- Structural Problem: the six plans don't scale credits linearly with price, so "upgrade one tier" doesn't reliably mean "proportionally more headroom" — a structural comparison a buyer needs before deciding which plan actually absorbs their usage pattern.
- Proposed H1: `GitHub Copilot Plans Compared by AI Credits, Not Price`
- Source: GitHub official plan pages + cross-referenced third-party pricing trackers
- Interlinks: cluster 21, cluster 25

### 29. Pick Cheaper Copilot Models to Stretch Your Credits

- Status: written (2026-08-19)
- Slug: pick-cheaper-copilot-models-stretch-credits
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 10
- Search Intent / Signal: per-model token pricing table (frontier vs. lightweight models priced differently per credit) — verbatim confirmed (official docs pricing table).
- Structural Problem: because credits are priced per-model, routing routine tasks to a cheaper model and reserving frontier models for genuinely hard tasks is a real cost lever credits expose more directly than PRU's flat multipliers did — a practical "which model for which task" angle distinct from cluster 22's mechanics explanation.
- Proposed H1: `Pick Cheaper Copilot Models to Stretch Your Credits`
- Source: docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing (same table as cluster 22, different angle — model-selection strategy, not calculation mechanics)
- Interlinks: cluster 22, cluster 27 (Agent Mode — model choice matters most there)

### 30. What to Do Before GitHub Copilot's Sept 1 Credit Cliff

- Status: written (2026-08-19)
- Slug: github-copilot-sept-1-credit-cliff-checklist
- Series: `copilot-ai-credits-cliff-2026`
- SeriesOrder: 11
- Search Intent / Signal: Synthesis/closing cluster, not a single dated announcement — ties together clusters 21, 25, 26, 28 into a practical "what to configure before Sept 1" action sequence.
- Structural Problem: an admin facing the Sept 1 cliff needs the budget-control mechanism (cluster 25), the exhaustion behavior it prevents (cluster 26), and the tier comparison (cluster 28) synthesized into one decision sequence, not scattered across separate docs pages — matches this site's own established pattern of a synthesis cluster closing out a pricing-reset pillar (same shape as cluster 20's `same-prompt-different-bill-gpt-claude-gemini` closing Pillar 2).
- Proposed H1: `What to Do Before GitHub Copilot's Sept 1 Credit Cliff`
- Source: synthesis of clusters 21, 25, 26, 28 above
- Interlinks: cluster 21, cluster 25, cluster 26, cluster 28, `same-prompt-different-bill-gpt-claude-gemini` (structural precedent for a closing synthesis cluster)
