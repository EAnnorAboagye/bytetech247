# Content Plan — AI Productivity

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar

**The MCP 2026-07-28 Spec Rewrite: What Breaks in Your Servers and Clients**

- Status: approved
- Slug: -
- Why pillar: The Model Context Protocol's 2026-07-28 specification, published 2026-07-28 (9 days before this research), is a genuinely comprehensive rewrite: a stateless protocol core, removed session handling, a new required server RPC, a replaced subscription mechanism, moved/removed protocol methods, and multiple feature-level deprecations (Roots, Sampling, Logging, Dynamic Client Registration). Sourced directly from the official MCP specification changelog (`modelcontextprotocol.io/specification/2026-07-28/changelog`), which lists far more than 10 distinct, verbatim, non-overlapping technical changes, no stretching required. This is directly dogfooded: this exact session runs on Claude Code, connected to multiple real MCP servers (GitHub, Cloudflare, Slack, and others), so every cluster describes a protocol this environment's own tooling actually speaks. The existing `prompting-guide-ai-coding-assistants` post covers prompting technique, not protocol mechanics, so there's no collision.

## Clusters

### 1. MCP Removes Protocol-Level Sessions (Mcp-Session-Id)

- Status: approved
- Slug: -
- Search Intent / Signal: `"Eliminated Mcp-Session-Id header from Streamable HTTP transport; list endpoints no longer vary per-connection; servers use explicit handles for cross-call state"` — verbatim confirmed.
- Structural Problem: Servers that relied on the `Mcp-Session-Id` header for sticky routing or per-connection state lose that mechanism entirely. Cross-call state now requires explicit, server-minted handles passed as ordinary tool arguments (tracked under SEP-2567), a genuine architecture change for any server holding connection-scoped state, not a header rename.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet (this session's own MCP servers are the real-world example)

### 2. MCP Replaces initialize Handshake With _meta Fields

- Status: approved
- Slug: -
- Search Intent / Signal: `"Removed initialize/notifications/initialized handshake; requests now carry protocol version and capabilities in _meta (io.modelcontextprotocol/protocolVersion, io.modelcontextprotocol/clientCapabilities); version mismatches return UnsupportedProtocolVersionError"` — verbatim confirmed.
- Structural Problem: Any client or server that gates its behavior on a completed `initialize` handshake needs a structural rewrite: protocol version and capability negotiation happens per-request now, via `_meta` fields, not once at connection start. Code that assumes "negotiate once, trust it for the rest of the session" no longer has a session to trust.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 1 (same stateless-core rewrite, distinct mechanism)

### 3. MCP Servers Must Now Implement server/discover

- Status: approved
- Slug: -
- Search Intent / Signal: `"Added server/discover RPC: Servers must implement this to advertise their supported protocol versions, capabilities, and identity; clients may call before other requests"` — verbatim confirmed.
- Structural Problem: This is a new mandatory capability, not an optional add-on. Any existing MCP server implementation that predates this spec revision needs a new RPC handler added before a 2026-07-28-compliant client can safely negotiate with it, since there's no longer an `initialize` call to fall back on for that discovery.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 2 (the handshake this discovery mechanism replaces)

### 4. MCP Replaces SSE Subscriptions With subscriptions/listen

- Status: approved
- Slug: -
- Search Intent / Signal: `"Introduced subscriptions/listen as a single long-lived POST-response stream for opted-in server-to-client change notifications; clients opt into specific types (toolsListChanged, promptsListChanged, resourcesListChanged, resourceSubscriptions)"` — verbatim confirmed.
- Structural Problem: The old model of a persistent SSE GET connection for server-initiated notifications is replaced by an opt-in, typed subscription model over a single POST stream. A client that assumed every notification type arrives automatically needs to explicitly request each type it cares about.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

### 5. MCP Removes the ping and logging/setLevel Methods

- Status: approved
- Slug: -
- Search Intent / Signal: `"Removed protocols: ping, logging/setLevel, notifications/roots/list_changed; log level now set per-request via io.modelcontextprotocol/logLevel in _meta"` — verbatim confirmed.
- Structural Problem: A client health-checking a server with `ping`, or setting log verbosity with `logging/setLevel`, has no direct replacement RPC for either; log level moves to a per-request `_meta` field instead of a standalone call, and there's no stated replacement for `ping` as a liveness check.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 9 (the broader Roots/Sampling/Logging feature deprecation, a distinct angle on adjacent territory)

### 6. MCP Moves Tasks Out of Core Into an Extension

- Status: approved
- Slug: -
- Search Intent / Signal: `"Moved experimental tasks to official extension io.modelcontextprotocol/tasks; replaced blocking tasks/result with polling via tasks/get and new tasks/update"` — verbatim confirmed.
- Structural Problem: Long-running task tracking moves from an experimental core feature to a formal, separately-namespaced extension, and the interaction pattern changes from a blocking result call to explicit polling. Code written against the experimental `tasks/result` call needs both a namespace update and a control-flow rewrite to polling.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

### 7. MCP Requires resultType on Every Returned Result

- Status: approved
- Slug: -
- Search Intent / Signal: `"All results now carry mandatory resultType: complete or input_required"` and `"Multi Round-Trip Requests (MRTR) pattern replaces server-initiated requests; servers return InputRequiredResult with resultType: input_required and inputRequests field"` — verbatim confirmed.
- Structural Problem: Every server response now needs an explicit `resultType` discriminator, and the old pattern of a server initiating a mid-call request to the client is replaced by the client recognizing `resultType: "input_required"` and handling `inputRequests` explicitly. A server or client built against the old implicit result shape breaks on both ends: sending results without the field, and not handling the new input-required branch.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet

### 8. MCP Removes SSE Resumability (Last-Event-ID Gone)

- Status: approved
- Slug: -
- Search Intent / Signal: `"Eliminated Last-Event-ID header and SSE event IDs; broken streams require re-issuing as new requests"` — verbatim confirmed.
- Structural Problem: A client that reconnects a dropped SSE stream using `Last-Event-ID` to resume from where it left off has no equivalent mechanism anymore; the correct behavior after a broken stream is now to re-issue the entire request as new, not resume in place, a real reliability-handling change for any client with retry/reconnect logic.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 4 (same transport layer, distinct reliability mechanism)

### 9. MCP Deprecates Roots, Sampling, and Logging

- Status: approved
- Slug: -
- Search Intent / Signal: `"Roots, Sampling, and Logging features deprecated; suggested migrations provided"` — verbatim confirmed. Deprecated, not yet removed: the spec's own governance policy guarantees a minimum twelve-month window before removal.
- Structural Problem: Unlike the Major Changes above, which are already-effective breaking changes, this is a deprecation notice with a runway: any server or client built on these three feature areas keeps working today but is on a clock. The practical action is auditing which of the three a given implementation actually uses and planning the migration now, not waiting for a forced break.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: cluster 5 (the specific removed `ping`/`logging/setLevel` methods, a narrower, already-effective angle on adjacent territory)

### 10. MCP Deprecates OAuth Dynamic Client Registration

- Status: approved
- Slug: -
- Search Intent / Signal: `"OAuth 2.0 Dynamic Client Registration Protocol (RFC 7591) deprecated in favor of Client ID Metadata Documents"` — verbatim confirmed.
- Structural Problem: Any MCP client that dynamically registers itself with an authorization server via RFC 7591 DCR needs to plan a migration to Client ID Metadata Documents (CIMD) instead. This is an authorization-layer change distinct from every other cluster here, which are all core-protocol or transport changes.
- Source: Model Context Protocol specification changelog, 2026-07-28 revision, published 2026-07-28
- Interlinks: none yet
