// The live outbound probe against a user-supplied MCP server URL — the one
// genuinely novel piece of network code in this codebase (first third-party
// fetch() at request time; only env.ASSETS.fetch(), an internal binding
// call, existed before this). See src/lib/mcp-compatibility-data.ts for the
// primary-sourced detection strategy this implements and for the pure
// classification/audit logic that turns this probe's raw result into a
// CompatibilityReport.
//
// SSRF: Cloudflare Workers' own fetch() already refuses to connect to raw
// private/RFC1918/loopback IP addresses at the platform level (confirmed via
// live research, 2026-08-14 — a raw-IP fetch from a Worker commonly
// surfaces as a 403, documented, intentional platform behavior, not a bug to
// work around). This module adds defense-in-depth on top — rejecting
// non-http(s) schemes and obvious loopback hostnames before even attempting
// the fetch — and, critically, catches the platform's own rejection cleanly
// rather than letting it become an unhandled exception.
//
// Five independent checks run in parallel against the target, each sourced
// directly from the official spec (changelog + Streamable HTTP transport
// page, both fetched live 2026-08-14) rather than invented:
//
// 1. server/discover — the RPC every 2026-07-28-compliant server MUST
//    implement (SEP-2575). The primary, most decisive signal.
// 2. Legacy initialize handshake — run unconditionally now (not just as a
//    fallback when #1 fails), since a server can validly support both
//    during the ecosystem's adaptation window; this is informational, not
//    pass/fail on its own.
// 3. Header enforcement — deliberately sends a server/discover request
//    missing the required Mcp-Method header, to test whether the server
//    actually validates it (MUST reject with HeaderMismatch, -32020, per
//    the transport spec's "Server Validation" section). Distinguishes a
//    server that's serious about the modern contract from one that only
//    happens to also respond to server/discover.
// 4. Deprecated ping removal — the 2026-07-28 changelog fully removes
//    `ping` (Major change #5), not just deprecates it. A modern server
//    SHOULD return "Method not found" for it; still answering it is a sign
//    of carried-forward legacy surface.
// 5. GET endpoint behavior — a server running only this revision MUST
//    respond 405 to GET on the MCP endpoint (the old HTTP+SSE transport's
//    GET-for-SSE-stream mechanism is gone). A 200 with an SSE stream here
//    means the server is still serving the deprecated HTTP+SSE transport
//    directly on this endpoint — informational (the spec permits dual-
//    hosting on a separate endpoint), not an automatic fail.
//
// Request shape (headers + params._meta) confirmed directly against the
// transport spec: every 2026-07-28 request MUST carry an
// MCP-Protocol-Version header, a Mcp-Method header mirroring the JSON-RPC
// `method` field, and a params._meta block with
// io.modelcontextprotocol/protocolVersion + clientInfo + clientCapabilities.
// Getting this right on our own *discover* request matters even before
// check #3 above: a genuinely compliant server has no legitimate reason to
// reject a correctly-formed request as malformed.
//
// v1 limitation, stated not silent: every check here only parses a plain
// application/json JSON-RPC response. A server that replies to a POST as an
// SSE stream (a valid Streamable HTTP response mode) is reported as
// reachable on that channel but that specific check comes back inconclusive
// rather than correctly parsed — real SSE parsing is not yet built.

// McpProbeResult's canonical definition lives in src/lib/mcp-compatibility-data.ts
// (imported, not redeclared) — an earlier version of this file duplicated
// the interface here, which let the two drift out of sync the first time
// this probe's fields changed. See that module for the full detection
// strategy this function implements.
import type { McpProbeResult } from "../../src/lib/mcp-compatibility-data";

const PROBE_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1_000_000;
const PROTOCOL_VERSION = "2026-07-28";
const CLIENT_INFO = {
  name: "bytetech247-mcp-compatibility-checker",
  version: "1.0.0",
};

// Modern-era-only JSON-RPC error codes (per the spec's error code allocation
// policy) — seeing any of these proves the server implements the 2026-07-28
// request/response contract, independent of whether this specific call
// succeeded. -32601 (Method not found) is deliberately NOT in this set: it's
// a generic JSON-RPC 2.0 code any server era can return, and for the
// specific case of server/discover — a method every compliant server MUST
// implement — getting it back means the opposite: the server doesn't know
// this spec-mandated method.
const RECOGNIZED_MODERN_ERROR_CODES = new Set([
  -32020, // HeaderMismatch
  -32021, // MissingRequiredClientCapability
  -32022, // UnsupportedProtocolVersion
]);

const OBVIOUS_LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
]);

function validateTargetUrl(rawUrl: string): URL | { error: string } {
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return { error: "Not a valid URL." };
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return { error: "Only http:// and https:// URLs are supported." };
  }
  if (OBVIOUS_LOOPBACK_HOSTS.has(target.hostname.toLowerCase())) {
    return { error: "Loopback/local addresses are not allowed." };
  }
  return target;
}

type JsonRpcPostResult =
  { json: unknown; headers: Headers } | { error: string };

async function postJsonRpc(
  target: URL,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<JsonRpcPostResult> {
  let response: Response;
  try {
    response = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
  } catch (err) {
    // Covers both real network failures and Cloudflare's own platform-level
    // SSRF rejection for private/internal IPs — neither should surface as
    // an unhandled exception to the caller.
    return {
      error:
        err instanceof Error && err.name === "TimeoutError"
          ? "Request timed out."
          : "Could not connect to this server.",
    };
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      error: `Server responded with unsupported content-type: ${contentType || "none"}.`,
    };
  }

  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    return { error: "Response exceeded the size limit." };
  }

  // Deliberately not gating on response.ok: per the transport spec, a fully
  // modern server legitimately returns JSON-RPC errors (including "Method
  // not found") over HTTP 400/404, not just 200 — the body, not the status
  // code, is what carries meaning here (see "Backward Compatibility" on the
  // transport spec page).
  try {
    return { json: JSON.parse(text), headers: response.headers };
  } catch {
    return { error: "Server response was not valid JSON." };
  }
}

function isJsonRpcResult(
  json: unknown,
): json is { result: Record<string, unknown> } {
  return (
    typeof json === "object" &&
    json !== null &&
    "result" in json &&
    typeof (json as { result: unknown }).result === "object" &&
    (json as { result: unknown }).result !== null
  );
}

function isJsonRpcError(
  json: unknown,
): json is { error: { code: number; message?: string } } {
  return (
    typeof json === "object" &&
    json !== null &&
    "error" in json &&
    typeof (json as { error: unknown }).error === "object" &&
    (json as { error: unknown }).error !== null &&
    typeof (json as { error: { code: unknown } }).error.code === "number"
  );
}

function discoverMeta() {
  return {
    "io.modelcontextprotocol/protocolVersion": PROTOCOL_VERSION,
    "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
    "io.modelcontextprotocol/clientCapabilities": {},
  };
}

// --- Check 1: server/discover ---

interface DiscoverProbe {
  reached: boolean;
  supported: boolean;
  protocolVersions?: string[];
  resultTypePresent?: boolean;
  sessionIdPresent?: boolean;
  recognizedModernError?: { code: number; message?: string };
  errorMessage?: string;
}

async function probeDiscover(target: URL): Promise<DiscoverProbe> {
  const response = await postJsonRpc(
    target,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "server/discover",
      params: { _meta: discoverMeta() },
    },
    {
      "MCP-Protocol-Version": PROTOCOL_VERSION,
      "Mcp-Method": "server/discover",
    },
  );
  if ("error" in response) {
    return { reached: false, supported: false, errorMessage: response.error };
  }

  const { json, headers } = response;
  if (isJsonRpcResult(json)) {
    const versions = json.result.protocolVersions;
    return {
      reached: true,
      supported: true,
      protocolVersions: Array.isArray(versions)
        ? versions.filter((v): v is string => typeof v === "string")
        : undefined,
      resultTypePresent: typeof json.result.resultType === "string",
      sessionIdPresent: headers.has("Mcp-Session-Id"),
    };
  }
  if (
    isJsonRpcError(json) &&
    RECOGNIZED_MODERN_ERROR_CODES.has(json.error.code)
  ) {
    return {
      reached: true,
      supported: false,
      recognizedModernError: {
        code: json.error.code,
        message: json.error.message,
      },
    };
  }
  return { reached: true, supported: false };
}

// --- Check 2: legacy initialize handshake (informational) ---

interface LegacyProbe {
  reached: boolean;
  protocolVersion?: string;
  sessionIdPresent?: boolean;
}

async function probeLegacyInitialize(target: URL): Promise<LegacyProbe> {
  const response = await postJsonRpc(target, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: CLIENT_INFO,
    },
  });
  if ("error" in response) return { reached: false };

  const { json, headers } = response;
  if (isJsonRpcResult(json)) {
    const protocolVersion = json.result.protocolVersion;
    return {
      reached: true,
      protocolVersion:
        typeof protocolVersion === "string" ? protocolVersion : undefined,
      sessionIdPresent: headers.has("Mcp-Session-Id"),
    };
  }
  return { reached: true };
}

// --- Check 3: header enforcement ---

export type HeaderEnforcementStatus =
  "enforced" | "not_enforced" | "not_applicable";

async function probeHeaderEnforcement(
  target: URL,
): Promise<{ reached: boolean; status: HeaderEnforcementStatus }> {
  // Same body as the real discover call, but the Mcp-Method header this
  // exact request requires is deliberately omitted — a compliant server
  // MUST reject this with HeaderMismatch (-32020, "Server Validation").
  const response = await postJsonRpc(
    target,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "server/discover",
      params: { _meta: discoverMeta() },
    },
    { "MCP-Protocol-Version": PROTOCOL_VERSION },
  );
  if ("error" in response) return { reached: false, status: "not_applicable" };

  const { json } = response;
  if (isJsonRpcError(json)) {
    if (json.error.code === -32020)
      return { reached: true, status: "enforced" };
    // -32601 (or anything else) means the server isn't even attempting the
    // modern per-request contract in the first place — this check doesn't
    // meaningfully apply to it, so it's not a fail.
    return { reached: true, status: "not_applicable" };
  }
  if (isJsonRpcResult(json)) {
    // Accepted a request missing a required header — a real compliance gap.
    return { reached: true, status: "not_enforced" };
  }
  return { reached: true, status: "not_applicable" };
}

// --- Check 4: deprecated ping removal ---

async function probePing(
  target: URL,
): Promise<{
  reached: boolean;
  applicable: boolean;
  stillSupported?: boolean;
}> {
  const response = await postJsonRpc(
    target,
    { jsonrpc: "2.0", id: 1, method: "ping", params: {} },
    { "MCP-Protocol-Version": PROTOCOL_VERSION, "Mcp-Method": "ping" },
  );
  if ("error" in response) return { reached: false, applicable: false };

  const { json } = response;
  if (isJsonRpcError(json) && json.error.code === -32601) {
    return { reached: true, applicable: true, stillSupported: false };
  }
  if (isJsonRpcResult(json)) {
    return { reached: true, applicable: true, stillSupported: true };
  }
  return { reached: true, applicable: false };
}

// --- Check 5: GET endpoint behavior ---

export type GetEndpointBehavior =
  "modern_405" | "legacy_sse" | "other" | "unreachable";

async function probeGetEndpoint(
  target: URL,
): Promise<{ reached: boolean; behavior: GetEndpointBehavior }> {
  try {
    const response = await fetch(target.toString(), {
      method: "GET",
      headers: { Accept: "text/event-stream" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (response.status === 405)
      return { reached: true, behavior: "modern_405" };
    const contentType = response.headers.get("Content-Type") ?? "";
    if (response.status === 200 && contentType.includes("text/event-stream")) {
      return { reached: true, behavior: "legacy_sse" };
    }
    return { reached: true, behavior: "other" };
  } catch {
    return { reached: false, behavior: "unreachable" };
  }
}

export async function probeMcpServer(rawUrl: string): Promise<McpProbeResult> {
  const target = validateTargetUrl(rawUrl);
  if ("error" in target) {
    return {
      reachable: false,
      discoverSupported: false,
      errorMessage: target.error,
    };
  }

  const [discover, legacy, headerEnforcement, ping, getEndpoint] =
    await Promise.all([
      probeDiscover(target),
      probeLegacyInitialize(target),
      probeHeaderEnforcement(target),
      probePing(target),
      probeGetEndpoint(target),
    ]);

  const reachedOnAnyChannel =
    discover.reached ||
    legacy.reached ||
    headerEnforcement.reached ||
    ping.reached ||
    getEndpoint.reached;

  if (!reachedOnAnyChannel) {
    return {
      reachable: false,
      discoverSupported: false,
      errorMessage:
        discover.errorMessage ?? "Could not connect to this server.",
    };
  }

  return {
    reachable: true,
    discoverSupported: discover.supported,
    discoverProtocolVersions: discover.protocolVersions,
    discoverResultTypePresent: discover.resultTypePresent,
    discoverSessionIdPresent: discover.sessionIdPresent,
    discoverRecognizedModernError: discover.recognizedModernError,
    legacyInitializeProtocolVersion: legacy.protocolVersion,
    legacySessionIdPresent: legacy.sessionIdPresent,
    legacyInitializeReached: legacy.reached,
    headerEnforcement: headerEnforcement.status,
    pingCheckApplicable: ping.applicable,
    pingStillSupported: ping.stillSupported,
    getEndpointBehavior: getEndpoint.behavior,
  };
}
