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

import { CATEGORY_SLUGS } from "../src/config";

export interface Env {
  ASSETS: Fetcher;
  COUNTERS_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  // Set once via `wrangler secret put CSP_NONCE_SECRET` — never committed.
  // See deriveNonce() below for what it's used for.
  CSP_NONCE_SECRET: string;
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

/**
 * View/reaction counter endpoint. Expects the *client* to batch/debounce
 * and send one request per interval, not one per pageview (build-spec.md
 * Phase 11 — the free KV plan's 1,000 writes/day limit is easy to exceed
 * well before real scale otherwise). No client-side instrumentation calls
 * this yet — nothing in the UI displays a view count today (Trending is
 * Phase 13, post-launch), so wiring automatic pings ahead of a consumer
 * would just be unused network traffic. This endpoint exists so that
 * work can be added independently later without touching the Worker.
 */
async function handleCounter(request: Request, env: Env): Promise<Response> {
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
