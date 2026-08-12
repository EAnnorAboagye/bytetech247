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

- Status: pending
- Slug: -
- Why pillar: Researched for, and built to interlink with, the newly-shipped `/tools/ai-token-counter/` page. Within the last ~90 days (research date 2026-08-11), all three major LLM providers shipped structural changes to context windows, tokenization, caching economics, or model lifecycle that directly change how many tokens a given prompt costs and what it's worth doing about it: GPT-5.6 went GA with a new 1.05M-token context window and an overhauled (no-longer-free) prompt-caching model; a wave of legacy OpenAI model IDs (gpt-4, o1, o4-mini) hit their real October 23, 2026 shutdown date; Claude Opus 4.8 shipped alongside a tokenizer (inherited from 4.7) that counts up to ~35% more tokens for the same input than pre-4.7 models, plus real breaking API-parameter changes; and Gemini 3.6 Flash launched with a meaningfully different token/cost profile than its predecessor. No existing post on this site covers token counting, context windows, or cross-provider pricing (confirmed against `src/content/blog/*/index.mdx` — the only ai-productivity content today is the MCP protocol pillar and a general prompting-technique guide), so there's no collision, and every cluster below is exactly the kind of "did my token math just change" question the token counter tool answers directly.
- Series: `2026-llm-token-pricing-reset`
- seriesOrder: continues the category's sequence at 11 (Pillar 1 used 1-10)
- Hub article: confirmed with user 2026-08-11 — yes, draft the pillar topic itself as a standalone hub article too (matches Pillar 1's precedent), linking out to all 10 clusters as they're written.

## Clusters (Pillar 2)

### 11. GPT-5.6's Context Window: 922K In, 128K Out Tokens

- Status: pending
- Slug: -
- Search Intent / Signal: GPT-5.6 (Sol/Terra/Luna) reached general availability with a 1.05M-token context window (up to 922K input, 128K output), using the o200k_base encoding shared with GPT-4o — paraphrased, aggregated across multiple 2026 model-tracking sites (Wikipedia's GPT-5.6 page, wavespeed.ai), not confirmed against OpenAI's own primary announcement post directly.
- Structural Problem: Existing integrations sized their context-management/chunking logic around older models' smaller windows (128K-200K for the GPT-4 family). A near-1M window changes the entire "when do I need to chunk/summarize" calculus, and the shared o200k_base encoding means token counts for GPT-5.6 differ from cl100k_base-based estimates (relevant caveat: this site's own AI Token Counter tool currently implements cl100k_base only, not o200k_base — a real, honest limitation worth surfacing in this cluster).
- Source: GPT-5.6 general availability, official API changelog date 2026-07-09 (per Wikipedia's GPT-5.6 entry, cross-referenced against wavespeed.ai's release-date tracking)
- Interlinks: cluster 20 (cross-provider cost comparison), `/tools/ai-token-counter/` (direct — the o200k_base caveat is exactly what the tool's own comparison table already discloses)

### 12. GPT-5.6 Ends Free Prompt-Cache Writes (1.25x Premium)

- Status: pending
- Slug: -
- Search Intent / Signal: Moving to GPT-5.6 replaced OpenAI's free, implicit prompt caching with explicit cache breakpoints, a 1.25x cache-write premium, and a 30-minute minimum TTL, while cache reads keep the existing 90% discount — paraphrased, sourced to third-party cost-analysis coverage (effloow.com), not OpenAI's own primary pricing docs directly.
- Structural Problem: Any integration that relied on OpenAI's previous "caching just happens, for free" model needs to add explicit cache-breakpoint configuration to keep getting a discount at all, and needs to budget for the new write-side cost that didn't exist before — a real code change, not just a number to note.
- Source: effloow.com prompt-cache cost analysis, tied to GPT-5.6 GA (2026-07-09)
- Interlinks: cluster 13 (cache retention extension), cluster 19 (OpenAI vs Anthropic caching comparison)

### 13. OpenAI Extends Prompt Cache Retention to 24 Hours

- Status: pending
- Slug: -
- Search Intent / Signal: OpenAI changed the default prompt-cache lifetime from a few minutes to up to 24 hours — paraphrased, sourced to effloow.com's measured cache-retention analysis.
- Structural Problem: Workflows that assumed a short cache window (and either didn't bother structuring prompts for cache hits, or worked around the short TTL some other way) can now restructure around a genuinely all-day cache lifetime — a real architecture decision for any agent/pipeline making repeated calls with a shared prefix.
- Source: effloow.com, dated 2026-05-29
- Interlinks: cluster 12 (the same caching overhaul), cluster 19

### 14. gpt-4, o1, and o4-mini Shut Down October 23, 2026

- Status: pending
- Slug: -
- Search Intent / Signal: `"Unless safety or compliance concerns require a faster timeline, we provide the following minimum notice periods before model retirement: Generally available models: At least 6 months."` — verbatim confirmed, fetched directly from OpenAI's own live deprecations page (developers.openai.com/api/docs/deprecations). That same page lists `gpt-4`/`gpt-4-0613`, `o1`/`o1-pro`, and `o4-mini` all shutting down 2026-10-23, with `gpt-5.6-sol` and `gpt-5.6-terra` as the named replacements, under the "2026-04-22: Legacy GPT model snapshots" notice.
- Structural Problem: After the shutdown date, API calls to these model IDs return errors instead of responses — not a soft deprecation warning, a hard cutover. Anyone still pointing at `gpt-4`, `o1`, or `o4-mini` needs a real migration to `gpt-5.6-sol`/`gpt-5.6-terra` before then, including re-checking token counts and costs against the new models' different tokenizer/pricing (direct tie to cluster 11).
- Source: OpenAI API deprecations page (developers.openai.com/api/docs/deprecations), notice dated 2026-04-22, shutdown 2026-10-23 — primary source, fetched directly
- Interlinks: cluster 11 (the replacement model's own context/token profile), `/tools/ai-token-counter/`

### 15. Claude Opus 4.8: Same Price, Cheaper Fast Mode

- Status: pending
- Slug: -
- Search Intent / Signal: Claude Opus 4.8 launched at the same base pricing as Opus 4.7 ($5/$25 per MTok), but Fast Mode dropped from $30/$150 to $10/$50 per MTok — paraphrased, sourced to third-party pricing-tracking coverage (finout.io), not Anthropic's own pricing page directly.
- Structural Problem: Anyone who priced out Fast Mode against Opus 4.7 and decided it was too expensive has a materially different cost equation now — a real re-evaluation, not just a footnote, especially for latency-sensitive workloads that specifically wanted Fast Mode.
- Source: finout.io Claude Opus 4.8 pricing breakdown, model launch dated 2026-05-28
- Interlinks: cluster 16 (the tokenizer this model inherited), cluster 20

### 16. Claude's New Tokenizer Counts Up to 35% More

- Status: pending
- Slug: -
- Search Intent / Signal: Opus 4.7 shipped an updated tokenizer that counts roughly 1.0-1.35x (up to ~35%) more tokens for the same input text than Opus 4.6 — paraphrased, sourced to third-party technical coverage (byteiota.com, developersdigest.tech). Explicitly **not confirmed** against Anthropic's own official GA changelog: a direct fetch of the GitHub changelog announcing Opus 4.7's general availability (2026-04-16) contains no mention of tokenizer or token-count changes at all, only general performance claims — worth stating plainly rather than presenting third-party reporting as if it were primary-sourced.
- Structural Problem: Same pricing per token doesn't mean same cost per prompt — if the same text now tokenizes to more tokens, the effective cost per API call goes up even though the headline $/MTok rate didn't change. Anyone tracking a cost budget against token counts needs to re-baseline, not just re-check the price sheet. Confirmed still in effect as of Opus 4.8 (2026-05-28): the tokenizer did not change between 4.7 and 4.8, so this remains today's behavior, not a one-version blip.
- Source: byteiota.com and developersdigest.tech technical coverage of Opus 4.7 (tokenizer claim); GA date 2026-04-16 confirmed via GitHub's official changelog (github.blog/changelog/2026-04-16-claude-opus-4-7-is-generally-available), which does **not** itself mention the tokenizer change; persistence into 4.8 per finout.io's 2026-05-28 Opus 4.8 coverage
- Interlinks: cluster 15, cluster 20, `/tools/ai-token-counter/` (direct — this is precisely the "why exact counts matter" case for the tool)

### 17. Claude Opus 4.7 Breaks temperature and top_p Params

- Status: pending
- Slug: -
- Search Intent / Signal: Opus 4.7 introduced breaking changes versus 4.6 where `budget_tokens` and the sampling parameters `temperature`/`top_p`/`top_k` all return HTTP 400 — paraphrased, sourced to third-party technical coverage, same caveat as cluster 16: not confirmed against Anthropic's own official GA changelog, which doesn't mention this.
- Structural Problem: Any client code passing these parameters (a common, previously-valid pattern) breaks outright on upgrade rather than degrading gracefully — a real, immediate integration fix, not a deprecation with runway.
- Source: Third-party Opus 4.7 technical coverage (same source cluster as 16); GA date 2026-04-16 per GitHub's official changelog (does not itself confirm this specific claim)
- Interlinks: cluster 16 (same release, distinct breaking-change angle)

### 18. Gemini 3.6 Flash Cuts Output Tokens 17%, Price Too

- Status: pending
- Slug: -
- Search Intent / Signal: Gemini 3.6 Flash launched using 17% fewer output tokens than Gemini 3.5 Flash for comparable tasks, at $1.50/$7.50 per million input/output tokens with a 1M-token context window — paraphrased, sourced to 9to5google.com's launch coverage (a reputable, dated tech-press source, though not Google's own primary blog post).
- Structural Problem: A model that genuinely uses fewer output tokens per task changes the cost-per-task math independently of the per-token price — two separate levers moving at once (price per token, and tokens per task), which is easy to conflate if you're only comparing sticker prices across models.
- Source: 9to5google.com, "Google launches Gemini 3.6 Flash and 3.5 Flash-Lite," dated 2026-07-21
- Interlinks: cluster 20

### 19. OpenAI vs Claude: Prompt Caching Cost Math in 2026

- Status: pending
- Slug: -
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
