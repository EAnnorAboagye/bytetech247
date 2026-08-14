// build-spec.md Phase 11: route branches inside the one deployed Worker's
// fetch() handler, falling through to static-asset serving for every
// route not explicitly listed here — not a fleet of separate Workers,
// not Cloudflare Pages Functions.
//
// This file is intentionally separate from the Astro build (the project
// stays output: 'static' — see astro.config.mjs) rather than adding the
// @astrojs/cloudflare SSR adapter, matching the spec's "thin edge
// backend" model: article content is always static HTML from `env.ASSETS`,
// never rendered per-request.

import { CATEGORY_SLUGS, siteConfig } from "../src/config";
import {
  classifyCompatibility,
  type CompatibilityReport,
} from "../src/lib/mcp-compatibility-data";
import { probeMcpServer } from "./lib/mcp-probe";
import { createCheckout, verifyWebhookSignature } from "./lib/lemon-squeezy";

export interface Env {
  ASSETS: Fetcher;
  COUNTERS_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  // Set once via `wrangler secret put CSP_NONCE_SECRET` — never committed.
  // See deriveNonce() below for what it's used for.
  CSP_NONCE_SECRET: string;
  // MCP Compatibility Checker payment integration (worker/lib/lemon-squeezy.ts).
  // API key + webhook secret are real secrets (`wrangler secret put`); store/
  // variant IDs are plain [vars] in wrangler.toml — they identify which
  // product to check out, not sensitive on their own.
  LEMON_SQUEEZY_API_KEY: string;
  LEMON_SQUEEZY_WEBHOOK_SECRET: string;
  LEMON_SQUEEZY_STORE_ID: string;
  LEMON_SQUEEZY_VARIANT_ID: string;
}

// A real per-request-unique CSP nonce would need every HTML response
// marked uncacheable, throwing away the edge caching this site relies on
// today (confirmed live: bytetech247.com HTML responses come back
// `cf-cache-status: HIT`). Deriving the nonce from a secret + a 5-minute
// time bucket instead means every request within the same window —
// cached or freshly computed — agrees on the same value, so caching
// keeps working unmodified while the nonce still rotates every 5
// minutes rather than staying fixed forever the way the old hash-based
// CSP did.
const NONCE_WINDOW_MS = 5 * 60 * 1000;

async function deriveNonce(secret: string): Promise<string> {
  const bucket = Math.floor(Date.now() / NONCE_WINDOW_MS);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(bucket)),
  );
  // base64url, no padding — '+', '/', '=' aren't valid inside a CSP
  // nonce-source token unquoted from the header's perspective, and this
  // is also going straight into an HTML attribute value.
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, 32);
}

// Google's own Publisher Tag docs are explicit that GPT/AdSense's
// ad-serving domains "change over time" and don't support a static
// host-allowlist CSP — they recommend nonce + 'strict-dynamic' instead
// (developers.google.com/publisher-tag/guides/content-security-policy).
// frame-src/img-src/connect-src widen to `https:` for the same reason:
// ad creatives, iframes, and measurement beacons span far more
// Google/ad-tech domains than can be safely enumerated (the exact
// mistake that made the old hash-based script-src go stale twice
// already, both times for the same Cloudflare beacon script — see git
// history). The actual XSS protection stays in script-src's nonce +
// strict-dynamic, which still blocks arbitrary injected script
// execution; widening the other directives only affects what ad
// *content* is allowed to render, a much lower-severity concern.
// require-trusted-types-for is left in place untouched — the
// pass-through `default` Trusted Types policy already registered in
// BaseLayout.astro (`createHTML: (html) => html`, etc.) accepts any
// unqualified sink usage, which is exactly what AdSense's internal
// script injection will hit, the same way it already transparently
// covers Astro's own ClientRouter today.
function cspFor(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https: http:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https: data:`,
    `font-src 'self'`,
    `frame-src https:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `require-trusted-types-for 'script'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

// Tags every <script> element in an HTML response with the current
// nonce (first-party scripts and the AdSense loader alike — whichever
// file they came from) and sets the matching Content-Security-Policy
// header. No-ops for non-HTML responses (the /api/counter JSON
// response, the markdown-alternate branch, etc.).
function applyCsp(response: Response, nonce: string): Response {
  if (!response.headers.get("Content-Type")?.includes("text/html")) {
    return response;
  }
  const rewritten = new HTMLRewriter()
    .on("script", {
      element(el) {
        el.setAttribute("nonce", nonce);
      },
    })
    .transform(response);
  const headers = new Headers(rewritten.headers);
  headers.set("Content-Security-Policy", cspFor(nonce));
  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers,
  });
}

// Sitewide preference declaration (contentsignals.org / draft-romm-aipref-
// contentsignals), delivered only as a response header now — it used to be
// echoed in public/robots.txt too, but Google added `content-signal` to its
// documented list of unsupported robots.txt directives in April 2026, which
// made Search Console's robots.txt report flag that line as an error, so it
// was removed from robots.txt (2026-08-05). This header is unaffected:
// Search Console's robots.txt report only parses the robots.txt file, not
// response headers on other pages, and this is exactly how Cloudflare's own
// "Markdown for Agents" feature echoes it (confirmed against a live example
// response from their docs).
const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

const ARTICLE_PATH = /^\/([a-z-]+)\/([a-z0-9-]+)\/?$/;

// Every HTML page that has a real, already-published markdown counterpart
// — the homepage's is the sitewide llms.txt index (src/pages/llms.txt.ts),
// every article's is its own [category]/[slug].md route (src/pages/
// [category]/[slug].md.ts). Deliberately does NOT invent an alternate for
// category/tag index pages, which have no markdown export to point to.
export function resolveMarkdownAlternate(
  pathname: string,
): { path: string; type: string } | null {
  if (pathname === "/") {
    return { path: "/llms.txt", type: "text/plain" };
  }
  const match = pathname.match(ARTICLE_PATH);
  if (match) {
    const [, category, slug] = match;
    if ((CATEGORY_SLUGS as readonly string[]).includes(category)) {
      return { path: `/${category}/${slug}.md`, type: "text/markdown" };
    }
  }
  return null;
}

// Minimal RFC 7231 §5.3.2 Accept-header comparison: true only when the
// client names text/markdown with a q-value at or above text/html's (both
// default to q=1 when present with no q param, 0 when absent). Real
// browsers never send text/markdown at all, so this never fires for
// ordinary visitors — only for a client that explicitly asked for it.
export function prefersMarkdown(request: Request): boolean {
  const accept = request.headers.get("Accept");
  if (!accept) return false;

  const qualityOf = (mediaType: string): number => {
    for (const part of accept.split(",")) {
      const [range, ...params] = part
        .trim()
        .split(";")
        .map((s) => s.trim());
      if (range === mediaType) {
        const qParam = params.find((p) => p.startsWith("q="));
        const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
        return Number.isNaN(q) ? 1 : q;
      }
    }
    return 0;
  };

  const markdownQ = qualityOf("text/markdown");
  if (markdownQ <= 0) return false;
  return markdownQ >= qualityOf("text/html");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/counter" && request.method === "POST") {
      return handleCounter(request, env);
    }

    if (url.pathname === "/api/mcp-check/start" && request.method === "POST") {
      return handleMcpCheckStart(request, env);
    }

    if (
      url.pathname === "/api/lemon-squeezy-webhook" &&
      request.method === "POST"
    ) {
      return handleLemonSqueezyWebhook(request, env);
    }

    if (url.pathname === "/api/mcp-check/status" && request.method === "GET") {
      return handleMcpCheckStatus(request, env);
    }

    if (
      url.pathname === "/api/mcp-check/recheck" &&
      request.method === "POST"
    ) {
      return handleMcpCheckRecheck(request, env);
    }

    // Computed once per request, reused at every HTML return point below
    // so a single response never mixes two different nonce values.
    const nonce = await deriveNonce(env.CSP_NONCE_SECRET);

    // Not yet implemented — falling through to static assets is the
    // correct behavior for both until they're built, not an error:
    //
    // - `/api/og/[slug]` (Satori-generated per-post OG image, cached at
    //   the edge after first render, purged only on content change). No
    //   post is missing an OG image in the meantime — BaseLayout already
    //   falls back to `siteConfig.defaultOgImage` for every page.
    // - `/go/[slug]` (affiliate redirect + KV click logging, Phase 14).
    //   Not built because no affiliate links exist yet — see
    //   /affiliate-disclosure/. Build this when that changes, not
    //   speculatively ahead of it.

    const alternate = resolveMarkdownAlternate(url.pathname);

    // Real Accept-based content negotiation (RFC 9110 §12), not a
    // suffix-only route: an agent that sends `Accept: text/markdown` to
    // the *article URL itself* now gets the markdown representation of
    // that same URL, instead of needing to already know the separate
    // `.md` path. Cache-Control: no-store on this branch only — Cloudflare's
    // edge cache keys on URL alone by default and ignores Vary, so without
    // this a markdown response fetched here could get cached and then
    // served back to a plain-HTML browser request for the same URL (and
    // vice versa). The `.md`/`llms.txt` assets it fetches from are cheap,
    // edge-local Workers Static Assets — never an origin round trip — so
    // disabling caching on just this branch costs nothing.
    if (alternate && request.method === "GET" && prefersMarkdown(request)) {
      const markdownResponse = await env.ASSETS.fetch(
        new URL(alternate.path, url).toString(),
      );
      if (markdownResponse.ok) {
        const headers = new Headers(markdownResponse.headers);
        headers.set("Vary", "Accept");
        headers.set("Cache-Control", "private, no-store");
        headers.set("Content-Signal", CONTENT_SIGNAL);
        return new Response(markdownResponse.body, {
          status: markdownResponse.status,
          headers,
        });
      }
    }

    const response = await env.ASSETS.fetch(request);

    // RFC 8288 Link response header, advertising the real markdown
    // alternate for agents that check headers before deciding whether to
    // fetch/parse the HTML body — only added where one genuinely exists.
    if (
      alternate &&
      response.headers.get("Content-Type")?.includes("text/html")
    ) {
      const headers = new Headers(response.headers);
      headers.append(
        "Link",
        `<${alternate.path}>; rel="alternate"; type="${alternate.type}"`,
      );
      headers.set("Content-Signal", CONTENT_SIGNAL);
      const existingVary = headers.get("Vary");
      headers.set("Vary", existingVary ? `${existingVary}, Accept` : "Accept");
      return applyCsp(
        new Response(response.body, {
          status: response.status,
          headers,
        }),
        nonce,
      );
    }

    return applyCsp(response, nonce);
  },
};

interface CounterPayload {
  slug?: string;
  kind?: "view" | "reaction";
}

// This site's browser-facing CSP already restricts fetch() to 'self'
// connect-src, so no legitimate first-party page can even attempt a
// cross-origin call here — this check exists for the requests the CSP
// can't see: a POST from curl, a script, or any page on a different
// origin, none of which are bound by *this site's* headers. A same-origin
// browser POST always sends an Origin header on a state-changing request
// (fetch/XHR), so the only requests this lets through without an Origin
// header are non-browser clients, which the rate limit below still bounds.
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === siteConfig.url;
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 20;

/**
 * Fixed-window per-IP rate limit, bucketed by minute. Reuses COUNTERS_KV
 * (a dedicated key prefix per caller) rather than provisioning a new KV
 * namespace or a Durable Object just for this — reasonable for an
 * endpoint with no callers yet; revisit if real traffic ever needs
 * something stricter than "bounded", like Cloudflare's Rate Limiting
 * binding.
 *
 * Like handleCounter's own increment below, this read-then-write has a
 * race window under concurrent requests from the same IP within the same
 * window — a rate limit only needs to be approximately right to do its
 * job (bound abuse), unlike the view count itself, so that's an accepted
 * tradeoff here, not an oversight.
 *
 * `maxRequests`/`keyPrefix` default to the original counter-endpoint
 * values so the existing call site is unaffected; `/api/mcp-check/start`
 * passes a much lower ceiling under its own key prefix, since that
 * endpoint creates a real Lemon Squeezy checkout session per call — the
 * one dynamic route on this site that costs real money to abuse.
 */
export async function isRateLimited(
  env: Env,
  ip: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  keyPrefix: string = "ratelimit",
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `${keyPrefix}:${ip}:${bucket}`;
  const current = Number((await env.COUNTERS_KV.get(key)) ?? "0");
  if (current >= maxRequests) return true;
  await env.COUNTERS_KV.put(key, String(current + 1), {
    // Outlives the window itself so a bucket that's already at the limit
    // doesn't briefly disappear (and reset to 0) before the next bucket
    // takes over.
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2,
  });
  return false;
}

/**
 * View/reaction counter endpoint. Expects the *client* to batch/debounce
 * and send one request per interval, not one per pageview (build-spec.md
 * Phase 11 — the free KV plan's 1,000 writes/day limit is easy to exceed
 * well before real scale otherwise). No client-side instrumentation calls
 * this yet — nothing in the UI displays a view count today (Trending is
 * Phase 13, post-launch), so wiring automatic pings ahead of a consumer
 * would just be unused network traffic. This endpoint exists so that
 * work can be added independently later without touching the Worker.
 *
 * The increment itself is a plain KV read-then-write, not an atomic op —
 * Workers KV has no compare-and-swap or native increment, so two requests
 * for the same slug/kind landing inside the same eventually-consistent
 * window can race and undercount by one. Acceptable for a display-only
 * view/reaction count; if a future consumer (e.g. Phase 13 Trending) ever
 * needs an exact count, that's a real argument for a Durable Object,
 * which actually can serialize writes — not something to fake with KV.
 */
async function handleCounter(request: Request, env: Env): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (await isRateLimited(env, ip)) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let payload: CounterPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { slug, kind } = payload;
  if (!slug || (kind !== "view" && kind !== "reaction")) {
    return new Response(
      'Expected JSON body: { slug: string, kind: "view" | "reaction" }',
      { status: 400 },
    );
  }

  const key = `${kind}:${slug}`;
  const current = Number((await env.COUNTERS_KV.get(key)) ?? "0");
  await env.COUNTERS_KV.put(key, String(current + 1));

  return new Response(null, { status: 204 });
}

// MCP Compatibility Checker — payment-gated live probe. Three routes, one
// SESSION_KV record per attempt keyed `mcpcheck:{token}`, moving through
// exactly three states: "pending" (checkout created, webhook not yet
// received) -> "paid" (webhook confirmed, probe not yet run) -> "done"
// (probe ran once, result cached). See the plan file for the full flow
// diagram and the accepted, documented low-severity race at the paid->done
// transition (two near-simultaneous status requests for the same token
// could both observe "paid" and run the probe twice — money has already
// changed hands by that point either way, so this is a wasted duplicate
// fetch, not a security or billing bug).

const MCP_CHECK_KEY_PREFIX = "mcpcheck:";
// A paid check isn't single-use anymore in the sense of "one probe ever" —
// the reader gets a bounded re-check window (see RECHECK_WINDOW_MS) to
// confirm a fix without paying twice. The KV TTL has to outlive that whole
// window, not just the original checkout+poll cycle, so it's set from the
// window itself with a small buffer rather than a separately-chosen number
// that could quietly fall short of it.
const RECHECK_WINDOW_HOURS = 60;
const RECHECK_WINDOW_MS = RECHECK_WINDOW_HOURS * 60 * 60 * 1000;
const MCP_CHECK_TTL_SECONDS = Math.ceil(RECHECK_WINDOW_MS / 1000) + 3600;
// Far tighter than the counter endpoint's default 20/60s — this is the
// only route on the site that creates a real, billable Lemon Squeezy
// checkout session per call.
const MCP_START_RATE_LIMIT_MAX = 5;

interface McpCheckRecord {
  url: string;
  status: "pending" | "paid" | "done";
  result?: CompatibilityReport;
  /** Epoch ms — set once payment is confirmed; a re-check is allowed until this time. */
  recheckAvailableUntil?: number;
}

interface McpCheckStartPayload {
  url?: string;
}

async function handleMcpCheckStart(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (
    await isRateLimited(env, ip, MCP_START_RATE_LIMIT_MAX, "ratelimit-mcpstart")
  ) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let payload: McpCheckStartPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const targetUrl = payload.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return new Response("Expected JSON body: { url: string }", {
      status: 400,
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Only http:// and https:// URLs are supported", {
      status: 400,
    });
  }

  const token = crypto.randomUUID();
  const record: McpCheckRecord = { url: targetUrl, status: "pending" };
  await env.SESSION_KV.put(
    `${MCP_CHECK_KEY_PREFIX}${token}`,
    JSON.stringify(record),
    { expirationTtl: MCP_CHECK_TTL_SECONDS },
  );

  const redirectUrl = `${siteConfig.url}/tools/mcp-compatibility-checker/result/?token=${token}`;
  const checkoutResult = await createCheckout(
    {
      apiKey: env.LEMON_SQUEEZY_API_KEY,
      storeId: env.LEMON_SQUEEZY_STORE_ID,
      variantId: env.LEMON_SQUEEZY_VARIANT_ID,
    },
    { token, redirectUrl },
  );

  if ("error" in checkoutResult) {
    return new Response(checkoutResult.error, { status: 502 });
  }

  return new Response(
    JSON.stringify({ checkoutUrl: checkoutResult.checkoutUrl }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Lemon Squeezy webhook receiver. Deliberately does NOT go through
 * isAllowedOrigin()/isRateLimited() — the caller is Lemon Squeezy's own
 * servers, not a browser on this site, so an Origin check would either
 * reject legitimate calls or (since no Origin header is sent) pass
 * everything through anyway. The HMAC signature check below is the real
 * authentication mechanism here, and it alone is sufficient: an attacker
 * without the webhook secret cannot produce a valid signature no matter
 * how many requests they send.
 */
async function handleLemonSqueezyWebhook(
  request: Request,
  env: Env,
): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature");
  const valid = await verifyWebhookSignature(
    rawBody,
    signature,
    env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  );
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Only order_created moves a record from "pending" to "paid" — this
  // product is a one-time purchase, not a subscription, so no other Lemon
  // Squeezy event type is relevant here.
  if (request.headers.get("X-Event-Name") !== "order_created") {
    return new Response(null, { status: 204 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const token = (payload as { meta?: { custom_data?: { token?: unknown } } })
    ?.meta?.custom_data?.token;
  if (typeof token !== "string") {
    return new Response("Missing custom_data.token", { status: 400 });
  }

  const key = `${MCP_CHECK_KEY_PREFIX}${token}`;
  const existingRaw = await env.SESSION_KV.get(key);
  if (!existingRaw) {
    // Token already expired or never existed — not the webhook's fault;
    // acknowledge rather than error so Lemon Squeezy doesn't retry
    // indefinitely for a record that's simply gone.
    return new Response(null, { status: 204 });
  }

  const existing = JSON.parse(existingRaw) as McpCheckRecord;
  if (existing.status === "pending") {
    // The re-check window starts from confirmed payment, not from whenever
    // the reader happens to first view the result — those are usually
    // seconds apart, but payment is the actual event being purchased.
    const updated: McpCheckRecord = {
      ...existing,
      status: "paid",
      recheckAvailableUntil: Date.now() + RECHECK_WINDOW_MS,
    };
    await env.SESSION_KV.put(key, JSON.stringify(updated), {
      expirationTtl: MCP_CHECK_TTL_SECONDS,
    });
  }

  return new Response(null, { status: 204 });
}

async function handleMcpCheckStatus(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (
    await isRateLimited(env, ip, RATE_LIMIT_MAX_REQUESTS, "ratelimit-mcpstatus")
  ) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const key = `${MCP_CHECK_KEY_PREFIX}${token}`;
  const raw = await env.SESSION_KV.get(key);
  if (!raw) {
    return new Response(JSON.stringify({ status: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = JSON.parse(raw) as McpCheckRecord;

  if (record.status === "pending") {
    return new Response(JSON.stringify({ status: "pending" }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (record.status === "done" && record.result) {
    return new Response(
      JSON.stringify({
        status: "done",
        url: record.url,
        result: record.result,
        recheckAvailableUntil: record.recheckAvailableUntil ?? null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // record.status === "paid" — claim it (flip to "done") by writing the
  // computed result back immediately after probing, so a same-token
  // double-request only ever risks a duplicate outbound probe, never a
  // duplicate charge or a free extra check (see the module comment above).
  const probe = await probeMcpServer(record.url);
  const result = classifyCompatibility(probe);
  const updated: McpCheckRecord = { ...record, status: "done", result };
  await env.SESSION_KV.put(key, JSON.stringify(updated), {
    expirationTtl: MCP_CHECK_TTL_SECONDS,
  });

  return new Response(
    JSON.stringify({
      status: "done",
      url: updated.url,
      result,
      recheckAvailableUntil: updated.recheckAvailableUntil ?? null,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

interface McpCheckRecheckPayload {
  token?: string;
}

/**
 * Re-runs the live probe for an already-paid token, within the bounded
 * re-check window set at payment confirmation (RECHECK_WINDOW_HOURS) — the
 * fix for the original design's "pay again just to confirm your fix
 * worked" friction. Gated on an existing "done" record with a valid token
 * (unguessable, crypto.randomUUID()), so — unlike /api/mcp-check/start —
 * this can't be used to get a free first check; it can only re-run a probe
 * someone already paid for.
 */
async function handleMcpCheckRecheck(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (await isRateLimited(env, ip, 10, "ratelimit-mcprecheck")) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let payload: McpCheckRecheckPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const token = payload.token;
  if (!token) {
    return new Response("Expected JSON body: { token: string }", {
      status: 400,
    });
  }

  const key = `${MCP_CHECK_KEY_PREFIX}${token}`;
  const raw = await env.SESSION_KV.get(key);
  if (!raw) {
    return new Response(JSON.stringify({ status: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = JSON.parse(raw) as McpCheckRecord;
  if (record.status !== "done") {
    return new Response(JSON.stringify({ status: "not_ready" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (
    !record.recheckAvailableUntil ||
    Date.now() > record.recheckAvailableUntil
  ) {
    return new Response(JSON.stringify({ status: "recheck_expired" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const probe = await probeMcpServer(record.url);
  const result = classifyCompatibility(probe);
  const updated: McpCheckRecord = { ...record, result };
  await env.SESSION_KV.put(key, JSON.stringify(updated), {
    expirationTtl: MCP_CHECK_TTL_SECONDS,
  });

  return new Response(
    JSON.stringify({
      status: "done",
      url: updated.url,
      result,
      recheckAvailableUntil: updated.recheckAvailableUntil ?? null,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
