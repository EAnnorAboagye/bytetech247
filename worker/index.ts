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

export interface Env {
  ASSETS: Fetcher;
  COUNTERS_KV: KVNamespace;
  SESSION_KV: KVNamespace;
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

    return env.ASSETS.fetch(request);
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
      "Expected JSON body: { slug: string, kind: \"view\" | \"reaction\" }",
      { status: 400 },
    );
  }

  const key = `${kind}:${slug}`;
  const current = Number((await env.COUNTERS_KV.get(key)) ?? "0");
  await env.COUNTERS_KV.put(key, String(current + 1));

  return new Response(null, { status: 204 });
}
