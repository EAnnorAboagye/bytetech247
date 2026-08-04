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

### 2. Astro 7 compressHTML Default Breaks Inline Spacing
- Status: pending
- Slug: -
- Search Intent / Signal: [paraphrased] Spacing between inline elements (`<span>`, `<em>`) placed on separate lines silently disappears after upgrading to Astro 7 — no console error at all, purely visual. Distinct from the existing post's case (see Interlinks): that post covers two `{expression}` blocks on separate lines merging; this cluster is specifically the version-upgrade regression for adjacent inline HTML elements, framed as "this broke when I upgraded," not an evergreen bug report.
- Structural Problem: Astro 7 flips `compressHTML`'s default from HTML-aware compression to JSX-style whitespace stripping, per [feat: make jsx whitespace handling the default (#16965)](https://github.com/withastro/astro/commit/57ead0d5938e5988e3f896f3d6f8ef4516c4923f). Whitespace and line breaks around elements are now stripped by default, collapsing space that Astro 6 preserved — with zero build-time signal, so it ships to production silently.
- Source: [Upgrade to Astro v7 | Docs](https://docs.astro.build/en/guides/upgrade-to/v7/); [Whitespace in Astro 7.0](https://cassidoo.co/post/astro-7-whitespace/) — both dated around the 2026-06-22 stable release.
- Interlinks: **[astro-whitespace-collapse-expression-bug](../../src/content/blog/astro-whitespace-collapse-expression-bug/index.mdx)** — real collision candidate, checked directly. That post (published 2026-07-30) covers whitespace collapse between two `{expr}` blocks generally, not tied to the v7 upgrade. Keep as a separate cluster (distinct angle: upgrade regression vs. evergreen bug, inline elements vs. expressions) but link both directions once this is written — do not silently duplicate that post's ground.

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

### 5. Fix "Property render Does Not Exist" in Astro
- Status: pending
- Slug: -
- Search Intent / Signal: [confirmed] `Property 'render' does not exist on type 'never'`
- Structural Problem: After a schema edit or a major-version bump, Astro's generated collection types in `.astro/types.d.ts` go stale. TypeScript then narrows collection entries to `never`, so calling `.render()` or accessing a new schema field throws a compile-time type error that looks like a content bug but is really a stale type cache — fixed by running `astro sync` (or deleting `.astro/types.d.ts` and re-syncing).
- Source: [Content collections | Docs](https://docs.astro.build/en/guides/content-collections/) — `astro sync` guidance, current v7 docs.
- Interlinks: none yet.
