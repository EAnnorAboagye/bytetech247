// Classification rules for the MCP Compatibility Checker, sourced directly
// from two official primary sources fetched live 2026-08-14 — not inferred
// from this site's own earlier "stateful -> stateless" pillar research,
// which covered the *what* but not the wire-level *how* a live probe can
// actually tell the two spec eras apart:
//
// - modelcontextprotocol.io/specification/2026-07-28/changelog — what
//   changed (server/discover added, initialize handshake + Mcp-Session-Id
//   removed, ping/logging/setLevel removed, every result requires a
//   resultType field).
// - modelcontextprotocol.io/specification/2026-07-28/basic/transports/
//   streamable-http — the exact wire format: required MCP-Protocol-Version/
//   Mcp-Method headers and params._meta block on every request, the
//   server-side header-validation requirement (HeaderMismatch, -32020), the
//   GET-endpoint behavior for a modern-only server (405), and the spec's
//   own documented backward-compatibility detection algorithm (inspect the
//   JSON-RPC error body, not just the HTTP status, before assuming legacy).
//
// This module does two things: derives an overall compatible/legacy/unknown
// verdict (the historical v1 behavior, still the headline), and — new as of
// this pass — builds an itemized, pass/fail/informational audit across 6
// independently-checkable spec signals, not just the single server/discover
// call. The paid product is this itemized audit, not a single yes/no: a
// buyer gets a report that's materially harder to reproduce by hand than
// running one curl command against the changelog.
//
// worker/lib/mcp-probe.ts performs the actual live probe (5 requests, run in
// parallel) and builds an McpProbeResult — the canonical type lives here,
// imported by the probe (an earlier version duplicated the interface and let
// the two drift out of sync; kept in one place since). This module turns
// that result into a human-readable CompatibilityReport. Kept separate,
// pure, and DOM/network-free — same split as llm-pricing-data.ts/
// llm-pricing-math.ts — so the classification logic is unit-testable
// without a live network call.

import { MCP_CHECK_FREE_MODE } from "../config";

// Referenced by the two recommendation strings below, which are the only
// place in this "pure" module that needs to know about pricing at all —
// they get echoed verbatim into the JSON result and the exported Markdown
// report, so "available after payment" would be a false statement while
// MCP_CHECK_FREE_MODE is on.
const RECHECK_WINDOW_PHRASE = MCP_CHECK_FREE_MODE
  ? "available for a limited window"
  : "available for a limited window after payment";

export const MCP_SPEC_VERIFIED_DATE = "2026-08-14";

export const MCP_SPEC_SOURCE =
  "https://modelcontextprotocol.io/specification/2026-07-28/changelog";

const MCP_TRANSPORT_SOURCE =
  "https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http";

export type McpCompatibilityStatus = "compatible" | "legacy" | "unknown";

export type HeaderEnforcementStatus =
  "enforced" | "not_enforced" | "not_applicable";

export type GetEndpointBehavior =
  "modern_405" | "legacy_sse" | "other" | "unreachable";

export interface McpProbeResult {
  /** false only when the target could not be reached at all. */
  reachable: boolean;
  /** true only when server/discover returned a real, usable result. */
  discoverSupported: boolean;
  /** Protocol versions the server advertised via server/discover, if any. */
  discoverProtocolVersions?: string[];
  /** Whether the server/discover result carried the spec-required resultType field. */
  discoverResultTypePresent?: boolean;
  /** Whether the server/discover response carried an Mcp-Session-Id header — a mechanism the 2026-07-28 spec removes entirely. */
  discoverSessionIdPresent?: boolean;
  /**
   * Set when server/discover itself didn't succeed, but the JSON-RPC error
   * code returned is one only a modern (2026-07-28-era) server would ever
   * produce — strong evidence the server is modern even without a usable
   * discover result.
   */
  discoverRecognizedModernError?: { code: number; message?: string };
  /** protocolVersion field from a legacy `initialize` response, if that path ran. */
  legacyInitializeProtocolVersion?: string;
  /** Whether a legacy `initialize` call got back an Mcp-Session-Id header. */
  legacySessionIdPresent?: boolean;
  /** Whether the legacy initialize call got any interpretable response at all. */
  legacyInitializeReached?: boolean;
  /** Whether the server actually validates the required Mcp-Method header. */
  headerEnforcement?: HeaderEnforcementStatus;
  /** Whether the deprecated `ping` check produced an interpretable result at all. */
  pingCheckApplicable?: boolean;
  /** true = server still answers the removed `ping` method. */
  pingStillSupported?: boolean;
  /** What a GET to the MCP endpoint returned. */
  getEndpointBehavior?: GetEndpointBehavior;
  /** Set when the target could not be reached or gave no interpretable response on any channel. */
  errorMessage?: string;
}

export type AuditCheckStatus = "pass" | "fail" | "info" | "not_applicable";

export interface AuditCheckResult {
  id: string;
  label: string;
  status: AuditCheckStatus;
  detail: string;
}

export interface CompatibilityReport {
  status: McpCompatibilityStatus;
  headline: string;
  detail: string;
  detectedVersion?: string;
  recommendations: string[];
  source: string;
  checks: AuditCheckResult[];
}

function buildChecks(probe: McpProbeResult): AuditCheckResult[] {
  const checks: AuditCheckResult[] = [];

  checks.push(
    probe.discoverSupported
      ? {
          id: "server-discover",
          label: "Implements server/discover",
          status: "pass",
          detail: "Responded to server/discover with a real, usable result.",
        }
      : probe.discoverRecognizedModernError
        ? {
            id: "server-discover",
            label: "Implements server/discover",
            status: "info",
            detail: `Did not return usable discovery data (error ${probe.discoverRecognizedModernError.code}), but the error shape itself is only produced by a modern server.`,
          }
        : {
            id: "server-discover",
            label: "Implements server/discover",
            status: "fail",
            detail:
              "Did not respond correctly to server/discover, the RPC every 2026-07-28-compliant server must expose.",
          },
  );

  if (probe.discoverSupported) {
    checks.push(
      probe.discoverResultTypePresent
        ? {
            id: "result-type",
            label: "Results carry the required resultType field",
            status: "pass",
            detail: "server/discover's response included a resultType field.",
          }
        : {
            id: "result-type",
            label: "Results carry the required resultType field",
            status: "fail",
            detail:
              "server/discover's response was missing the resultType field every 2026-07-28 result is required to carry.",
          },
    );
    checks.push(
      probe.discoverSessionIdPresent
        ? {
            id: "no-session-id",
            label: "No longer issues Mcp-Session-Id",
            status: "fail",
            detail:
              "The server/discover response still carried an Mcp-Session-Id header — a mechanism the 2026-07-28 spec removes entirely.",
          }
        : {
            id: "no-session-id",
            label: "No longer issues Mcp-Session-Id",
            status: "pass",
            detail:
              "No Mcp-Session-Id header was present on the server/discover response.",
          },
    );
  } else {
    checks.push(
      {
        id: "result-type",
        label: "Results carry the required resultType field",
        status: "not_applicable",
        detail:
          "Could not be checked — server/discover did not return a usable result to inspect.",
      },
      {
        id: "no-session-id",
        label: "No longer issues Mcp-Session-Id",
        status: "not_applicable",
        detail:
          "Could not be checked — server/discover did not return a usable result to inspect.",
      },
    );
  }

  const headerStatus = probe.headerEnforcement ?? "not_applicable";
  checks.push({
    id: "header-enforcement",
    label: "Validates required MCP-Protocol-Version / Mcp-Method headers",
    status:
      headerStatus === "enforced"
        ? "pass"
        : headerStatus === "not_enforced"
          ? "fail"
          : "not_applicable",
    detail:
      headerStatus === "enforced"
        ? "Correctly rejected a request missing the required Mcp-Method header with a HeaderMismatch error."
        : headerStatus === "not_enforced"
          ? "Accepted a request that was missing the required Mcp-Method header — the spec requires this to be rejected."
          : "Not meaningfully checkable — the server doesn't appear to implement the modern per-request header contract at all.",
  });

  if (probe.pingCheckApplicable) {
    checks.push(
      probe.pingStillSupported
        ? {
            id: "ping-removed",
            label: "Deprecated ping method removed",
            status: "fail",
            detail:
              "The server still answers the ping method, which the 2026-07-28 spec fully removes (not just deprecates).",
          }
        : {
            id: "ping-removed",
            label: "Deprecated ping method removed",
            status: "pass",
            detail: 'ping correctly returns "Method not found."',
          },
    );
  } else {
    checks.push({
      id: "ping-removed",
      label: "Deprecated ping method removed",
      status: "not_applicable",
      detail: "Could not be determined from this server's response.",
    });
  }

  const getBehavior = probe.getEndpointBehavior ?? "unreachable";
  checks.push({
    id: "get-endpoint",
    label: "MCP endpoint rejects GET (legacy HTTP+SSE not exposed here)",
    status:
      getBehavior === "modern_405"
        ? "pass"
        : getBehavior === "legacy_sse"
          ? "info"
          : "not_applicable",
    detail:
      getBehavior === "modern_405"
        ? "GET to the MCP endpoint correctly returned 405 Method Not Allowed."
        : getBehavior === "legacy_sse"
          ? "GET to this endpoint opened a legacy HTTP+SSE stream — the deprecated transport is still being served here directly. The spec permits this for backward compatibility, so it's informational, not a failure on its own."
          : "Could not be determined from this server's response.",
  });

  checks.push({
    id: "legacy-initialize",
    label: "Legacy initialize handshake",
    status: "info",
    detail: probe.legacyInitializeReached
      ? `Still accepts the legacy initialize handshake${probe.legacyInitializeProtocolVersion ? ` (reported protocol version ${probe.legacyInitializeProtocolVersion})` : ""} — fine to keep during the ecosystem's adaptation window, worth removing once older clients are gone.`
      : "Does not respond to the legacy initialize handshake — fine if every client you support already speaks the modern spec.",
  });

  return checks;
}

export function classifyCompatibility(
  probe: McpProbeResult,
): CompatibilityReport {
  if (!probe.reachable) {
    return {
      status: "unknown",
      headline: "Could not reach this server",
      detail:
        probe.errorMessage ??
        "The server did not respond on any of the checks this tool runs. Confirm the URL is correct, publicly reachable, and serving the MCP Streamable HTTP transport (not a stdio-only entrypoint).",
      recommendations: [
        "Confirm the URL points at your server's Streamable HTTP endpoint, not a stdio-only entrypoint.",
        "Confirm the server is publicly reachable from outside your own network.",
      ],
      source: MCP_SPEC_SOURCE,
      checks: [],
    };
  }

  const checks = buildChecks(probe);

  if (probe.discoverSupported) {
    const versions = probe.discoverProtocolVersions ?? [];
    const caveats: string[] = [];
    if (probe.discoverResultTypePresent === false) {
      caveats.push(
        "its server/discover response is missing the resultType field every 2026-07-28 result is required to carry — a sign of an incomplete migration, not a fully clean implementation",
      );
    }
    if (probe.discoverSessionIdPresent) {
      caveats.push(
        "it still issued an Mcp-Session-Id header on that response, a mechanism the 2026-07-28 spec removes entirely — likely a hybrid implementation that hasn't fully dropped the old session model",
      );
    }
    if (probe.headerEnforcement === "not_enforced") {
      caveats.push(
        "it did not reject a request missing the required Mcp-Method header, so header validation isn't actually being enforced",
      );
    }
    if (probe.pingStillSupported) {
      caveats.push(
        "it still answers the deprecated ping method, which this spec revision fully removes",
      );
    }

    return {
      status: "compatible",
      headline:
        caveats.length > 0
          ? "Compatible, but showing signs of a partial migration"
          : "Compatible with the 2026-07-28 MCP specification",
      detail: `This server correctly implements server/discover, the RPC every 2026-07-28-compliant server must expose.${
        versions.length > 0
          ? ` It advertises support for: ${versions.join(", ")}.`
          : " It did not advertise specific protocol versions in its response, but responded to the RPC correctly."
      }${caveats.length > 0 ? ` That said, ${caveats.join("; and ")}. See the full check list below for exactly what to fix.` : " The full check list below confirms this is a clean implementation, not just a passing headline."}`,
      detectedVersion: versions[0],
      recommendations:
        caveats.length > 0
          ? [
              "Work through the failed items in the check list below — each names exactly what's missing.",
              `Re-run this check (${RECHECK_WINDOW_PHRASE}) once you've addressed them to confirm a fully clean result.`,
            ]
          : [
              "No action needed for the July 2026 spec rewrite specifically.",
              "If you still also handle the old initialize handshake for backwards compatibility with older clients, that's fine to keep during the ecosystem's adaptation window.",
            ],
      source: MCP_SPEC_SOURCE,
      checks,
    };
  }

  if (probe.discoverRecognizedModernError) {
    const { code, message } = probe.discoverRecognizedModernError;
    return {
      status: "compatible",
      headline: "Likely compatible — server speaks the modern MCP contract",
      detail: `The server/discover call itself didn't return usable discovery data (JSON-RPC error ${code}${
        message ? `: "${message}"` : ""
      }), but that specific error is only ever produced by a server that already implements the 2026-07-28 request/response contract (per the spec's own documented backward-compatibility guidance). This is strong evidence the server is modern, even without a successful discover result — see the full check list below for the rest of the picture.`,
      recommendations: [
        "Check why server/discover itself failed — the request/header contract is understood, but this specific call isn't returning valid discovery data.",
        `Re-run this check (${RECHECK_WINDOW_PHRASE}) once server/discover returns a real result to confirm full compatibility.`,
      ],
      source: MCP_TRANSPORT_SOURCE,
      checks,
    };
  }

  // discoverSupported is false and no recognized-modern-error was seen, but
  // the server WAS reachable — it responded to something. Two sub-cases: it
  // rejected server/discover and then completed a legacy initialize
  // handshake (a clean legacy signal), or it responded to neither in an
  // interpretable way.
  if (probe.legacyInitializeProtocolVersion || probe.legacySessionIdPresent) {
    return {
      status: "legacy",
      headline: "Running an older, pre-2026-07-28 MCP specification",
      detail: `This server does not implement server/discover, but responded to the legacy initialize handshake${
        probe.legacyInitializeProtocolVersion
          ? ` and reported protocol version ${probe.legacyInitializeProtocolVersion}`
          : ""
      }${
        probe.legacySessionIdPresent
          ? ", issuing an Mcp-Session-Id header — a mechanism the 2026-07-28 spec removes entirely"
          : ""
      }. This most likely means it predates the July 2026 stateless rewrite, though it could also be an in-progress 2026-07-28 implementation that hasn't added server/discover yet. Either way, it will not interoperate with a client that only speaks the new spec. See the full check list below for what else was found.`,
      detectedVersion: probe.legacyInitializeProtocolVersion,
      recommendations: [
        "Upgrade to an SDK release that implements the 2026-07-28 specification — see the beta SDK announcement on the official MCP blog.",
        "At minimum, implement server/discover so clients can detect your server's real capabilities without guessing.",
        "Budget time inside the ecosystem's 10-week adaptation window before older clients start dropping support for the pre-rewrite handshake.",
      ],
      source: MCP_SPEC_SOURCE,
      checks,
    };
  }

  return {
    status: "unknown",
    headline: "Could not determine compatibility",
    detail:
      "The server responded, but neither confirmed support for server/discover nor completed a legacy initialize handshake in a way this checker could interpret. It may be a non-MCP server, a malformed MCP implementation, or a valid server responding as an SSE stream — a Streamable HTTP response mode this checker does not yet parse (a stated v1 limitation, not a silent gap).",
    recommendations: [
      "Confirm the URL is a genuine MCP server using the Streamable HTTP transport.",
      "Check the server's own logs for the request this checker sent.",
    ],
    source: MCP_SPEC_SOURCE,
    checks,
  };
}
