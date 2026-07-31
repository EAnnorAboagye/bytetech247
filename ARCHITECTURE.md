# Architecture

Condensed pointer into [`build-spec.md`](./build-spec.md) Part I — read that document for full detail and rationale. This file exists so the shape of the system is visible without opening the full spec.

## Model

Static-first site with a thin edge backend, not a traditional client/server app.

- **Frontend (build-time + client-side):** Astro pages/layouts, MDX content collection, design tokens (OKLCH colors, type scale, spacing, motion) read into Tailwind, a small component library (layout primitives + CVA-based components + MDX components), and a handful of hydrated islands (command palette/search, dark-mode toggle, view transitions, reading-progress bar). Everything else — article text, images, code blocks — ships as zero-JS static HTML.
- **Backend (runtime, edge-executed):** intentionally thin. A single native Cloudflare Worker (`bytetech247`) handles a few per-request routes — OG image generation, view/reaction counters, the affiliate redirect, the paywall gate (if/when built) — and falls through to static-asset serving for everything else. Article content is never dynamically rendered; a Worker or KV hiccup only affects a counter or gate check, never the article itself.

See `build-spec.md` §1–2 for the full architecture diagram and component breakdown.

## Rendering strategy

Full Static Site Generation (SSG) + Islands Architecture — every page renders to plain HTML at build time. See `build-spec.md` §3.

## Content taxonomy

Two axes: `category` (single, required, one of four locked values — Dev Tools, Data & Automation, AI Productivity, Guides & Fixes — drives the URL `/category/slug` and homepage sectioning) and `tags` (multiple, free-form, cross-cutting — power `/tag/[tag]` archives). See `build-spec.md` §9 before touching the category list; renaming one after posts ship means new URLs and redirects, not a quick edit.

## Design tokens

OKLCH color system (one neutral + one accent hue, light/dark from a single source), modular type scale, 8px spacing grid, cascade layers (`theme, reset, tokens, base, components, utilities, overrides`). One deliberate exception: code-block syntax highlighting (Shiki) is a fixed dark theme regardless of site-wide light/dark mode. See `build-spec.md` §1.4 and Phase 1.

## SEO / structured data

Every page emits site-wide `WebSite`/`Organization` JSON-LD (`src/lib/json-ld.ts`); article pages add `BlogPosting`/`NewsArticle` (type derived from category — none of the four locked categories are time-sensitive today) plus `BreadcrumbList` and `Person`. Canonical URLs, OG/Twitter meta, `sitemap.xml`, `rss.xml` (sitewide + per-category), and `llms.txt` are all generated from the same content collection and `src/config.ts` — no template hand-declares its own copy of site identity. See `build-spec.md` §11 and Phase 9.

## Deployment

Single Cloudflare Worker, `bytetech247`, static assets binding from `dist/`. Not Cloudflare Pages — see `build-spec.md` §11 for why a `*.workers.dev` domain requires a standalone Worker. See `wrangler.toml` and Phase 11.

## Where to look for more detail

- Full phase-by-phase build plan: `build-spec.md` Part II
- Mistakes to avoid per phase: `BUILD-GUARDRAILS.md`
- Content authoring: `CONTRIBUTING.md`
