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
}

// Sitewide preference declaration (contentsignals.org / draft-romm-aipref-
// contentsignals): same three values as the Content-Signal line in
// public/robots.txt, kept in sync by hand — that file is the primary
// declaration, this header just repeats it for agents that check response
// headers instead of fetching /robots.txt separately (this is exactly how
// Cloudflare's own "Markdown for Agents" feature echoes it, confirmed
// against a live example response from their docs).
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
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
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
