# Content Plan — Guides & Fixes

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

Target ecosystem: this repo's own stack, read live from `package.json` — `astro@^7.1.3`, `tailwindcss@^4.3.3`, `typescript@^6.0.3`, deployed to Cloudflare Workers via `wrangler`. Research window: real-world sources dated on or after 2026-06-22 (Astro 7.0.0 stable release), checked against the actual publish dates on each source below, not the sandbox clock.

Series wiring: every cluster written from this plan uses frontmatter `series: "Astro 7 Upgrade: Breaking Changes and Migration Fixes"` with `seriesOrder` matching its cluster number (1-5), so the site's built-in series navigation (`src/pages/[category]/[slug].astro`) links them together automatically once 2+ exist. Keep the `series` string identical, character for character, across every cluster's frontmatter.

## Pillar

**Astro 7 Upgrade: Breaking Changes and Migration Fixes**
- Status: pending
- Slug: -
- Why pillar: Astro 7.0.0 went stable 2026-06-22, about six weeks before this plan — comfortably inside the active-research window. It bundles four structurally distinct breaking changes (Rust compiler strictness, Vite 8 bump, compressHTML default flip, container-renderer entrypoint move) that hit most teams upgrading from v6, and each one supports a genuinely separate cluster below without stretching.

## Clusters

### 1. Fix ERESOLVE Vite 8 Peer Dependency Errors in Astro 7
- Status: written
- Slug: fix-eresolve-vite-8-peer-dependency-astro-7
- Search Intent / Signal: [confirmed, live-reproduced] `npm error code ERESOLVE` / `npm error ERESOLVE unable to resolve dependency tree`, captured directly via a real `npm install --dry-run` in this environment against `vite@^8.0.13` + `vite-plugin-pwa@1.2.0`. Refined during drafting from the original vaguer "integration reaches into Vite internals" framing to the more specific and verifiable peer-dependency mechanism.
- Structural Problem: Astro 7 depends directly on Vite 8 (`astro@7.1.3` declares `"vite": "^8.0.13"`). npm has refused to silently resolve an unsatisfiable peer dependency by default since npm 7, so any plugin whose `peerDependencies.vite` range hasn't been updated to include `^8.0.0` blocks the entire install with ERESOLVE.
- Source: npm registry data for `astro@7.1.3` and `vite-plugin-pwa` (fetched directly, 2026-08-04); [vite-pwa/vite-plugin-pwa#923](https://github.com/vite-pwa/vite-plugin-pwa/issues/923) (opened 2026-03-19, fixed in 1.3.0 on 2026-05-05).
- Interlinks: links to the `/guides-fixes` category index. No sibling cluster posts exist yet — add cross-links to Clusters 2-5 once they're written.

### 2. Fix Astro 7 compressHTML Spacing Bug After Upgrade
- Status: written
- Slug: fix-astro-7-compresshtml-spacing-bug
- Search Intent / Signal: [confirmed, live-reproduced] Verified directly on this site's own `astro@7.1.3` build: `<strong>5</strong>` and `<span>posts</span>` on separate lines compiled to `<strong>5</strong><span>posts</span>` (no space), and adding an explicit `{" "}` compiled to `<strong>5</strong> <span>posts</span>` (space restored). Confirmed by compiling a real test page through this repo's own Astro install, not just cited from docs.
- Structural Problem: Astro 7 flips `compressHTML`'s default from HTML-aware compression to JSX-style whitespace stripping, per [feat: make jsx whitespace handling the default (#16965)](https://github.com/withastro/astro/commit/57ead0d5938e5988e3f896f3d6f8ef4516c4923f). Whitespace and line breaks around elements are now stripped by default, collapsing space that Astro 6 preserved, with zero build-time signal, so it ships to production silently.
- Source: [Upgrade to Astro v7 | Docs](https://docs.astro.build/en/guides/upgrade-to/v7/); live build verification against this repo's `astro@7.1.3` (2026-08-04).
- Interlinks: bidirectional with **[astro-whitespace-collapse-expression-bug](../../src/content/blog/astro-whitespace-collapse-expression-bug/index.mdx)**, done both ways — that post now links forward to this one (and lists it in `relatedSlugs`), this one links back and disambiguates via a `Callout`. Also wired into the `series`/`seriesOrder` mechanism alongside Cluster 1; the site's series-nav confirmed rendering "(2 of 2)" on both posts after build.
- Note: cover image was initially near-identical in layout to the sibling post's cover (same "5posts"/"5 posts" framing) — caught before commit and redesigned around different example content ("Save 20%") and an "Astro 6 vs Astro 7" framing instead of "broken vs fixed," so the two don't read as duplicate thumbnails.
- Note: first build attempt failed with `TypeError: Cannot read properties of undefined (reading 'icon')` from `<Callout type="note">` — `Callout.astro` only accepts `info | tip | warning | danger`, not `note`. Fixed to `type="info"`. Caught by the mandatory rebuild-after-edit step, not before.
- Note (significant, caught on thorough review): the draft's original Callout claimed the sibling post's `{count}{label}` bug was "a different, version-independent bug," unrelated to `compressHTML`. Tested this directly by building both cases (the `{expr}{expr}` case and the `<strong>/<span>` case) under `compressHTML: true` vs the default `'jsx'` in this repo's own `astro.config.mjs` (temporarily, reverted after). Result: `compressHTML: true` fixes both cases; the default breaks both. They are the same root cause on two different node-pair types, not independent bugs. Corrected the Callout and FAQ here, and corrected the sibling post itself (it previously described the bug as an eternal "long-standing JSX" characteristic with no version caveat, published 2026-07-30 after Astro 7 was already stable, which was inaccurate) — added a `Callout` there citing the same test. If Clusters 3-5 touch whitespace/compression behavior again, verify against a live build before asserting version-scoped claims; don't trust a prior post's framing without re-checking it.

### 3. Fix Astro 7 getContainerRenderer Deprecation Warning
- Status: pending
- Slug: -
- Search Intent / Signal: [paraphrased] Deprecation warning logged when importing `getContainerRenderer` from an integration's package root after upgrading to Astro 7. Exact console warning text not independently verified in research — treat as paraphrased, not verbatim, until confirmed by actually reproducing it.
- Structural Problem: Astro 7 moves `getContainerRenderer()` out of each UI-framework integration's package root (React, Preact, Svelte, SolidJS, Vue, MDX) into a dedicated `/container-renderer` entrypoint. The old import path still resolves but logs a deprecation warning, because bundlers were pulling in unrelated package-root exports whenever only the Container API was needed. Note: this is a warning, not a crash — weaker urgency than the other clusters, worth confirming reader demand before writing.
- Source: [feat: return clientEntrypoint from getContainerRenderer (#14715)](https://github.com/withastro/astro/commit/3d55c5d0fb520d470b33d391e5b68861f5b51271); [Upgrade to Astro v7 | Docs](https://docs.astro.build/en/guides/upgrade-to/v7/).
- Interlinks: none yet.
- Note: an earlier draft of this cluster incorrectly attributed the verbatim string `"No valid renderer was found for this file extension."` (from [withastro/astro#14887](https://github.com/withastro/astro/issues/14887)) to this v7 change. Verified that issue is actually an unrelated Astro v5.15+ regression from November 2025, closed as a duplicate — not caused by the v7 entrypoint move. Corrected here; do not reuse that string for this cluster.

### 4. Fix Astro Cloudflare Deploy: Env Vars & _worker.js
- Status: pending
- Slug: -
- Search Intent / Signal: [confirmed, from issue titles] "`@astrojs/cloudflare` doesn't correctly forward wrangler `vars` to Astro" and deploy failing with a `_worker.js` error when using an Astro `base` path.
- Structural Problem: The official Cloudflare adapter doesn't fully bridge `astro:env` with `wrangler.jsonc`'s `vars`, and a base-path build emits a `dist/_worker.js` layout wrangler can't resolve without a manual asset-copy step in the build script. Both failures surface only at deploy time — `astro build` succeeds locally, then production breaks.
- Source: [withastro/astro#16790](https://github.com/withastro/astro/issues/16790); [withastro/astro#15134](https://github.com/withastro/astro/issues/15134).
- Interlinks: **[automate-static-site-deploys-github-actions-cloudflare-workers](../../src/content/blog/automate-static-site-deploys-github-actions-cloudflare-workers/index.mdx)** (category: data-automation) — not a collision, a sequel. That post covers choosing a deploy method; this cluster covers the runtime errors after deploy is already wired up. Link forward from that post once this is written.

### 5. RETIRED — replaced by a standalone post, not part of this series

The original plan ("Property render Does Not Exist" / stale `.astro/types.d.ts` narrowing to `never`) did not survive verification against this repo's real `astro@7.1.3`:

- `.render()` as an entry method doesn't exist in this site's API at all (`import { render } from "astro:content"` is a standalone function here, not `entry.render()` — that method belongs to Astro's pre-content-layer API).
- The "stale types" mechanism doesn't reproduce either. Tested live: editing `content.config.ts` with the dev server running triggered `Content config changed -> Clearing content store -> Synced content` automatically, and `InferEntrySchema` imports the real schema file directly rather than caching a snapshot, so TypeScript types stay current regardless of sync timing. Never got `never` to actually occur.

Replaced with a verified, real, reproducible error: **[Fix Astro InvalidContentEntryDataError Schema Errors](../../src/content/blog/fix-astro-invalidcontententrydataerror/index.mdx)** (slug: `fix-astro-invalidcontententrydataerror`, status: written). Reproduced 4 distinct causes directly against this repo's own schema (invalid enum, missing required field, wrong type, custom `.refine()`/`.max()` message), plus confirmed the whole build aborts on first invalid entry and that `astro check` catches it too.

This is **not an Astro 7 upgrade regression** (it's evergreen Zod/content-collection validation behavior), so per user decision it ships as a standalone `guides-fixes` post with no `series`/`seriesOrder` — it does not fill a slot in this pillar's 5-cluster count. The pillar currently has 2 written series entries (Clusters 1-2), Cluster 3 (weak, unconfirmed verbatim) and Cluster 4 (solid, sourced) still open, and no 5th slot filled.
