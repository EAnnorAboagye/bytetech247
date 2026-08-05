# Content Plan — Guides & Fixes

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

Target ecosystem: this repo's own stack, read live from `package.json` — `astro@^7.1.3`, `tailwindcss@^4.3.3`, `typescript@^6.0.3`, deployed to Cloudflare Workers via `wrangler`. Research window: real-world sources dated from the Astro 7 v7-beta period (early June 2026) through its 2026-06-22 stable GA and the current 7.1.x line, re-checked against today's date (2026-08-05) — comfortably inside the ~90-day freshness bar. Every date below is the source's own reported date, not the sandbox clock.

Series wiring: every cluster written from this plan uses frontmatter `series: "Astro 7 Upgrade: Breaking Changes and Migration Fixes"` with `seriesOrder` matching its cluster number (1-10), so the site's built-in series navigation (`src/pages/[category]/[slug].astro`) links them together automatically once 2+ exist. Keep the `series` string identical, character for character, across every cluster's frontmatter.

**2026-08-05 update:** a second pillar-cluster research pass, prompted by the current skill spec's "exactly 10 clusters" requirement, found that the original 4-breaking-change scope for this pillar was incomplete — it missed the single biggest Astro 7 breaking change of all: **Sätteri**, the new Rust-based Markdown/MDX engine that became the default processor in the same PR that this pillar was already built around conceptually. That gives this pillar real, non-overlapping structural depth for a full 10 clusters instead of ~4. Clusters 5-10 below are new from this pass; Clusters 1-4 are unchanged. Cluster 3 was replaced — its original premise (a paraphrased, never-verified "getContainerRenderer deprecation warning" claim) is superseded by a better-sourced, verbatim-confirmed bug that also involves `getContainerRenderer`, found during this pass. Ruled out as pillar candidates during this pass, with findings kept in reserve rather than discarded: Tailwind CSS 4.1-4.3.x (too thin, ~3 non-overlapping items, one redundant with Cluster 1), TypeScript 6.0 and ESLint 10 (real material exists for both, but it leans more on secondary-source paraphrase than primary docs — several primary sources, incl. `docs.astro.build` and `expressive-code.com`, 403'd on direct fetch from this environment today and would need a re-attempt), Vitest 3 (stale — the ecosystem has already moved to 4.x/5.0-beta), and wrangler/Cloudflare Workers Static Assets beyond the 404 issue already covered (thin — mostly incremental feature churn, not breaking changes).

## Pillar

**Astro 7 Upgrade: Breaking Changes and Migration Fixes**

- Status: written
- Slug: -
- Why pillar: Astro 7.0.0 went stable 2026-06-22, comfortably inside the active-research window. It bundles five structurally distinct breaking changes — Rust compiler strictness, the Vite 8 bump, the `compressHTML` default flip, Cloudflare Workers Static Assets' 404 handling, and (largest by far) swapping the entire remark/rehype Markdown/MDX pipeline for **Sätteri**, a new Rust-based processor (`@astrojs/markdown-satteri`, built on pulldown-cmark + Oxc) that has no plugin-compatibility layer. That last change alone genuinely supports 6 of this pillar's 10 clusters without stretching — it's the richest vein of dated, sourced, non-overlapping sub-issues found in this research pass.

## Clusters

### 1. Fix ERESOLVE Vite 8 Peer Dependency Errors in Astro 7

- Status: written
- Slug: fix-eresolve-vite-8-peer-dependency-astro-7
- Search Intent / Signal: [confirmed, live-reproduced] `npm error code ERESOLVE` / `npm error ERESOLVE unable to resolve dependency tree`, captured directly via a real `npm install --dry-run` in this environment against `vite@^8.0.13` + `vite-plugin-pwa@1.2.0`. Refined during drafting from the original vaguer "integration reaches into Vite internals" framing to the more specific and verifiable peer-dependency mechanism.
- Structural Problem: Astro 7 depends directly on Vite 8 (`astro@7.1.3` declares `"vite": "^8.0.13"`). npm has refused to silently resolve an unsatisfiable peer dependency by default since npm 7, so any plugin whose `peerDependencies.vite` range hasn't been updated to include `^8.0.0` blocks the entire install with ERESOLVE.
- Source: npm registry data for `astro@7.1.3` and `vite-plugin-pwa` (fetched directly, 2026-08-04); [vite-pwa/vite-plugin-pwa#923](https://github.com/vite-pwa/vite-plugin-pwa/issues/923) (opened 2026-03-19, fixed in 1.3.0 on 2026-05-05).
- Interlinks: links to the `/guides-fixes` category index. Cross-link to sibling series posts as they're written — Cluster 2 already links back; add Clusters 3-10 once they exist.

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

### 3. Fix Astro 7 Rollup Failed to Resolve Import satteri

- Status: written
- Slug: fix-astro-7-rollup-satteri-import-error
- **REPLACES the original premise for this slot** (see prior note below, kept for history): the old "getContainerRenderer deprecation warning" framing was never independently verified — no verbatim string, and the cited commit (#14715) is unrelated to Sätteri. This slot is now filled with a real, verbatim-confirmed bug that also involves `getContainerRenderer`, found during the 2026-08-05 research pass.
- Search Intent / Signal: [confirmed, verbatim] `Rollup failed to resolve import "satteri" from "/…/node_modules/@astrojs/mdx/dist/satteri/index.js". This is most likely unintended because it can break your application at runtime.`
- Structural Problem: Calling `getContainerRenderer()` (e.g. to render MDX content for an RSS feed) makes `@astrojs/mdx` eagerly import its Sätteri module path even when `markdown.processor` is still configured to the legacy `@astrojs/markdown-remark` unified pipeline. Rollup then tries to bundle an optional peer dependency (`satteri`) that isn't installed in that configuration, since it's only expected to be present when Sätteri is the active processor.
- Source: [Calling MDX renderer causes Satteri import to be resolved even if original Unified processor is being used (#16954)](https://github.com/withastro/astro/issues/16954), opened 2026-06-02, closed via PR #17093.
- Interlinks: series sibling of Clusters 1, 2, 4; shares its fix PR (#17093) with Cluster 5 below — same beta-period version-skew window, different symptom (Rollup unresolved import here vs. a Vite missing-export error there). Keep as separate posts, same precedent as the Cluster 1/2 compressHTML pair (same root cause, different code shape) — cross-link and disambiguate when both are written.
- Note (prior, kept for history): an earlier draft of the original premise incorrectly attributed the verbatim string `"No valid renderer was found for this file extension."` (from [withastro/astro#14887](https://github.com/withastro/astro/issues/14887)) to a v7 change. That issue is an unrelated Astro v5.15+ regression from November 2025, closed as a duplicate. Do not reuse that string for this cluster.
- Note (found while drafting, 2026-08-05): PR #17093 ("fix(integrations): Export container renderers from a dedicated export path to fix bundling issues") merged 2026-06-17, five days before Astro 7.0.0 GA, and fixes **both** #16954 and #17068 together, shipped in `@astrojs/mdx@7.0.0`. So this bug never affected any Astro 7 stable release, only the beta cycle. Framed the post honestly around that: fixed already, verify your `@astrojs/mdx` version rather than treating it as a live threat. Also confirmed this site's own `src/lib/rss.ts` never calls `getContainerRenderer()` (it only serializes frontmatter `description`, never renders MDX bodies), so this repo was never exposed to the bug at all - a real, checked (not assumed) dogfooding note. Reuse this same fix-PR/version/date info when drafting Cluster 5, it applies identically there.

### 4. RETIRED original premise — replaced, same slot, still part of the series

The original plan (`@astrojs/cloudflare` not forwarding `wrangler` vars to `astro:env`, and a `_worker.js` base-path failure) did not survive verification:

- [withastro/astro#16790](https://github.com/withastro/astro/issues/16790) (env vars): reported on Astro v6.3.5, **closed and fixed** via PR #17275. This site runs `astro@^7.1.3`, newer than where the fix landed, so any reader today is very likely already on a patched version.
- [withastro/astro#15134](https://github.com/withastro/astro/issues/15134) (`_worker.js` base path): reported on Astro v5.16.7, closed with a workaround, status of the underlying behavior on current Astro unconfirmed.
- Bigger problem: this site doesn't use `@astrojs/cloudflare` at all — no such dependency, no `adapter`/`output` config. It deploys as a static build via a hand-written `worker/index.ts` + Workers Static Assets, so neither issue was ever dogfoodable here in the first place.

Replaced with a verified, dogfooded, platform-level (not Astro-version-dependent) issue: **Fix Cloudflare Workers Empty 404 Page on Static Sites** (slug: `fix-cloudflare-workers-empty-404-astro`, status: written). `assets.not_found_handling` defaults to NOT serving a custom `404.html` on Workers Static Assets — confirmed via Cloudflare's own docs, this repo's own `wrangler.toml` comment (a real gap hit and fixed in this project's own history), and a live check against `bytetech247.com` confirming the fix works in production right now (real 404 status + real page body, not empty).

- Note: first draft of the article and cover image used `wrangler.jsonc` with JSON syntax throughout, assumed rather than checked. This repo's real config file is `wrangler.toml` (TOML syntax, `[assets]` section headers, unquoted keys) - caught by `ls wrangler*` after Prettier reformatted the (wrong) JSON code block and prompted a second look. Rewrote every code block, prose mention, and the cover image itself to match the real file. Lesson: verify the actual filename/format of anything referenced as "this site's own config," not just the setting name, before writing code examples around it.

- Search Intent / Signal: [confirmed, from Cloudflare's own docs] `not_found_handling: "404-page"` "overrides the default serving behavior of Workers for static assets" — the exact quoted doc line, not a paraphrase.
- Structural Problem: Cloudflare Workers Static Assets does not auto-detect and serve a `404.html` for unmatched routes by default; it takes a separate, generic fallback instead. The setting is required to opt into custom-404 behavior, independent of any Astro version or adapter choice.
- Source: [Cloudflare Static Assets — Static Site Generation docs](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/); this repo's own `wrangler.jsonc` (already configured with the fix, predates this session).
- Interlinks: bidirectional with **[automate-static-site-deploys-github-actions-cloudflare-workers](../../src/content/blog/automate-static-site-deploys-github-actions-cloudflare-workers/index.mdx)** (data-automation) — done both ways, that post now links forward and lists this one in `relatedSlugs`, this one links back.
- Note: could not locally reproduce the "before" broken state via `wrangler dev` in an isolated scratch project — the local workerd binary crashed (`std::terminate()`, unrelated to this bug, an environment issue on this machine). Relied on the live-production confirmation of the fixed state plus Cloudflare's own documented default instead, rather than forcing a local repro that wasn't cooperating.

### 5. Fix Astro 7 MISSING_EXPORT satteriCollectImagesPlugin

- Status: written
- Slug: fix-astro-7-missing-export-satteri-images
- Search Intent / Signal: [confirmed, verbatim] `[MISSING_EXPORT] "satteriCollectImagesPlugin" is not exported by "__vite-optional-peer-dep:@astrojs/markdown-satteri:@astrojs/mdx"`
- Structural Problem: Upgrading from Astro 6 to a 7 beta (e.g. via `@astrojs/upgrade`) could leave `@astrojs/mdx` and `@astrojs/markdown-satteri` at mismatched versions. The image-collection helper Sätteri's MDX integration expects to import didn't exist yet in the installed `@astrojs/markdown-satteri` version, so Vite's build fails resolving that named export.
- Source: [\[v7 beta\] `[MISSING_EXPORT] "satteriCollectImagesPlugin"` from `@astrojs/mdx` (#17068)](https://github.com/withastro/astro/issues/17068), opened 2026-06-13, closed via PR #17093.
- Interlinks: series sibling; shares its fix PR (#17093) with Cluster 3 above — cross-link and disambiguate (missing Vite export here vs. unresolved Rollup import there).

### 6. Fix Astro 7 markdown.rehypePlugins Deprecation Warning

- Status: written
- Slug: fix-astro-7-rehypeplugins-deprecation-warning
- Search Intent / Signal: [confirmed, live-reproduced] `[astro] \`markdown.remarkPlugins\`, \`markdown.rehypePlugins\`, and \`markdown.remarkRehype\` are deprecated. Pass them to \`unified({...})\` from \`@astrojs/markdown-remark\` directly instead.`— captured directly from running`npx astro build`against this repo's own`astro@7.1.3`, which has real `markdown.rehypePlugins: [rehypeTableHeaderScope, rehypeCodeBlockChrome]`configured in`astro.config.mjs` (confirmed by reading the file: a comment there already flags "astro logs a deprecation warning ... but the current API is still functional"). This is the **strongest-evidenced cluster in the whole pillar** — dogfooded on this exact site, not just cited from an external issue.
- Structural Problem: Setting any of the top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, or `markdown.remarkRehype` config keys makes Astro fall back to the legacy `@astrojs/markdown-remark` unified pipeline instead of the new Sätteri default (confirmed: this repo's own `node_modules/@astrojs/mdx` declares `@astrojs/markdown-remark@7.2.1` as a real dependency, and the build still emits all pages using those plugins). The plugins keep working, but the top-level keys themselves are deprecated in favor of passing them to `unified({...})` directly, so every build using the old shape prints this warning.
- Source: this repo's own `npx astro build` output against `astro@7.1.3`, captured 2026-08-05; corroborated by [PR #16966 "feat: make Sätteri the default Markdown pipeline"](https://github.com/withastro/astro/pull/16966) (merged 2026-06-15), whose changeset text states verbatim: "To keep using the remark/rehype pipeline, install `@astrojs/markdown-remark` and set it as your processor."
- Interlinks: series sibling; distinguish clearly from Cluster 7 below — this warning fires because this repo's config genuinely uses `rehypePlugins`, unlike Cluster 7's false positive.

### 7. Fix Astro 7's False markdown.gfm Deprecation Warning

- Status: written
- Slug: fix-astro-7-false-markdown-gfm-deprecation-warning
- Search Intent / Signal: [confirmed, verbatim] `"markdown.gfm" and "markdown.smartypants" are deprecated. Move them onto your processor instead...`
- Structural Problem: Astro's deprecated-config-key check for `markdown.gfm`/`markdown.smartypants` fires whenever the Container API renders MDX content — even in a project that never set either option. It's a false positive triggered by the Container-API-plus-MDX render path itself, not by anything in the reader's actual config, which is what makes it confusing to debug.
- Source: [Deprecation warning with Sätteri + Container API + MDX (#17206)](https://github.com/withastro/astro/issues/17206), opened 2026-06-26, closed via PR #17261.
- Interlinks: series sibling; pair with Cluster 6 above (same "deprecation warning" theme, different keys and triggers — one real, one a false positive).

### 8. Fix Astro 7 Cannot Find Package satteri Error (pnpm)

- Status: written
- Slug: fix-astro-7-cannot-find-package-satteri-pnpm
- Search Intent / Signal: [confirmed, verbatim] `Cannot find package 'satteri' imported from .../node_modules/@astrojs/mdx/dist/satteri/index.js`
- Structural Problem: `@astrojs/mdx` statically imports the `satteri` package without declaring it as a direct dependency in its own `package.json` (historically kept only in devDependencies). Under pnpm's strict, isolated `node_modules` layout, the bare import can only resolve by accident via pnpm's internal `.pnpm/node_modules` fallback link; when that link is missing, the build fails outright.
- Source: [`@astrojs/mdx` imports satteri but does not declare it (pnpm ERR_MODULE_NOT_FOUND) (#17371)](https://github.com/withastro/astro/issues/17371), opened 2026-07-13, **still open** as of this research (2026-08-05) — directly affects `@astrojs/mdx@7.0.3`, this repo's exact pinned version. A related fix attempt, PR #17372, was closed without merging on 2026-07-16.
- Interlinks: series sibling; write this one first if timeliness matters — it's the only cluster in this pillar still unresolved upstream. This site itself uses npm (`package-lock.json`), not pnpm, so it isn't directly exposed, but the underlying missing-dependency-declaration bug is real and version-pinned regardless of package manager.
- Note (found while drafting, 2026-08-05): re-checked #17371 immediately before drafting, still open, no merged fix, PR #17372 closed unmerged 2026-07-16. Built a real scratch pnpm project (`pnpm add astro@^7.1.3 @astrojs/mdx@^7.0.3`, resolved to `@astrojs/mdx@7.0.5`/`astro@7.1.6`) to try reproducing the exact build failure. A plain `npx astro build` succeeded cleanly both with and without an actual `.mdx` page, so the full crash didn't reproduce this time, consistent with the issue's own description of it being intermittent (depends on whether pnpm's accidental `.pnpm/node_modules` fallback link happens to exist). Did directly reproduce the underlying resolution gap though: `node -e "require.resolve('satteri')"` failed under pnpm's default isolated linker, then succeeded after adding `node-linker=hoisted` to `.npmrc` and reinstalling. Wrote the post around that live-tested workaround rather than the full crash, since the crash itself wasn't reliably forceable. If a future pass finds the crash reproduces more reliably (e.g. a specific lockfile state), that's worth folding in as an update, not a rewrite.

### 9. Fix astro-mermaid Diagrams Breaking Under Astro 7

- Status: written
- Slug: fix-astro-mermaid-diagrams-breaking-astro-7
- Search Intent / Signal: [confirmed, verbatim] `markdown.remarkPlugins/rehypePlugins/remarkRehype are set, but your satteri processor doesn't run them.`
- Structural Problem: astro-mermaid's remark transform only registers itself when `markdown.processor` resolves to the legacy `unified()` processor. Under Astro 7's Sätteri default that check never passes, so the plugin never runs — with no error or warning of its own — and ` ```mermaid ` code fences render as plain, unstyled code blocks instead of diagrams.
- Source: [Feature request: Support Astro 7 Sätteri markdown processor (#71)](https://github.com/joesaby/astro-mermaid/issues/71), opened 2026-06-24, closed via PR #72.
- Interlinks: series sibling; frame as a named, concrete worked example, generalizable to any other remark-based diagram or content-transform plugin hitting the same silent no-op.

### 10. Fix Astro 7 Duplicate Heading IDs From Sätteri Bug

- Status: written
- Slug: fix-astro-7-satteri-duplicate-heading-ids
- Search Intent / Signal: [paraphrased] No verbatim error string, still true after verification — this is a silent-corruption bug (duplicate entries in a page's `headings` metadata array), not a thrown exception or console warning.
- Structural Problem (corrected while drafting, 2026-08-05): the original guess above was wrong and has been replaced. Opened the real diff this time via direct fetch of `withastro/astro` commit `3b5e994`. The actual bug: Sätteri's heading-ids plugin pushed each heading directly onto the shared `astro.headings` array (`astro?.headings.push({ depth, slug, text })`). When another integration - the changeset names **Starlight** specifically - runs its own heading-ID pass before Sätteri's anchor-link pass touches the same page, the second pass appends onto whatever the first pass already put there instead of replacing it, producing duplicate entries in the page's heading metadata (used for tables of contents / sidebar anchors). Not a "calling the plugin manually" scenario as originally guessed - it's a two-integration interaction.
- Source: [PR #17165](https://github.com/withastro/astro/pull/17165), "fix(satteri): Make heading-ids plugin idempotent," merged 2026-06-23. Verbatim changeset quote (fetched directly): "Fixes headings being listed twice in a page's `headings` metadata when an integration (such as Starlight) assigns heading IDs with its own heading pass before adding anchor links." Diff confirmed: `packages/markdown/satteri/src/satteri-processor.ts`, before/after both fetched directly.
- Interlinks: series sibling; relevant to anyone running Starlight or another heading-ID-assigning integration alongside Sätteri.
- Note (dogfooded, found while drafting): this repo's own `node_modules/@astrojs/markdown-satteri@0.3.4` was grepped directly and already contains the fixed code (`const headings = []` collected locally, then `astro.headings = headings` assigned once) - live confirmation this repo runs a patched version, not just a claim from the changelog.

---

### Non-pillar note: standalone post (was "Cluster 5" under the old 5-slot count)

The original plan ("Property render Does Not Exist" / stale `.astro/types.d.ts` narrowing to `never`) did not survive verification against this repo's real `astro@7.1.3`:

- `.render()` as an entry method doesn't exist in this site's API at all (`import { render } from "astro:content"` is a standalone function here, not `entry.render()` — that method belongs to Astro's pre-content-layer API).
- The "stale types" mechanism doesn't reproduce either. Tested live: editing `content.config.ts` with the dev server running triggered `Content config changed -> Clearing content store -> Synced content` automatically, and `InferEntrySchema` imports the real schema file directly rather than caching a snapshot, so TypeScript types stay current regardless of sync timing. Never got `never` to actually occur.

Replaced with a verified, real, reproducible error: **[Fix Astro InvalidContentEntryDataError Schema Errors](../../src/content/blog/fix-astro-invalidcontententrydataerror/index.mdx)** (slug: `fix-astro-invalidcontententrydataerror`, status: written). Reproduced 4 distinct causes directly against this repo's own schema (invalid enum, missing required field, wrong type, custom `.refine()`/`.max()` message), plus confirmed the whole build aborts on first invalid entry and that `astro check` catches it too.

This is **not an Astro 7 upgrade regression** (it's evergreen Zod/content-collection validation behavior), so per user decision it ships as a standalone `guides-fixes` post with no `series`/`seriesOrder` — it never filled a numbered slot in this pillar and isn't counted in the 10 clusters above.

### Pillar status summary (2026-08-05, updated)

10/10 cluster slots filled and **all 10 written**. Clusters 1, 2, 4 were already published before this pillar-cluster pass; Clusters 3, 5, 6, 7, 8 were drafted and published in the first work session; Clusters 9 and 10 were drafted and published in a follow-up session after user approval. Cluster 8 (`#17371`, pnpm) remains the only sub-issue still open upstream as of this research. Cluster 10's original premise was corrected during drafting after opening the real PR diff (see its entry above) - the mechanism is a Starlight/Sätteri heading-metadata interaction, not a "call the plugin twice" scenario as first guessed. This pillar is now complete; a future `pillar-cluster` run for `guides-fixes` should research a **new** pillar rather than add more slots here. Two ruled-out research leads are worth a future targeted pass rather than reuse: Expressive Code's Sätteri HAST-plugin requirement (couldn't get past a 403 on `expressive-code.com` today) and a possible `smartPunctuation` default-behavior cluster (only pre-Sätteri, out-of-window issues turned up; no in-window verbatim source found).

---

# Pillar 2 — researched 2026-08-05, second pillar-cluster pass

Pillar 1 above is complete (10/10 written) and covers Astro 7's Markdown/MDX content-processing layer (Sätteri). This second pillar covers a structurally distinct layer of the same Astro 7 upgrade: the **bundler underneath it**. Confirmed via this repo's own `package-lock.json`: `astro@7.1.3` (this site's exact pinned version) declares `"vite": "^8.0.13"` as a direct dependency, resolving here to `vite@8.1.5` / `rolldown@1.1.5`. Vite 8 didn't just bump a version number — it replaced Vite 7's dual esbuild+Rollup toolchain with a single Rust-based stack: **Rolldown** (bundling + dependency optimization, replacing both esbuild-for-deps and Rollup-for-build), **Oxc** (JS transform, replacing esbuild's transform step), and **Lightning CSS** (CSS minification by default, replacing esbuild's CSS handling). That's a new bundler architecture, not an incremental bump — genuinely rich, structurally non-overlapping ground from Pillar 1, and actively breaking real projects across the research window.

Existing-content collision check (2026-08-05): grepped every published post under `src/content/blog/*/index.mdx` for "rolldown", "lightning css", and "oxc" — zero matches. The only existing post touching "Vite 8" at all is `fix-eresolve-vite-8-peer-dependency-astro-7`, which is narrowly about npm's install-time peer-dependency resolution failure — a different failure class (install-time, package-manager-level) from every cluster below (all build-time/runtime, after a successful install). Named as a related interlink where relevant rather than folded in, per the skill's "genuinely distinct angle" rule.

Research window note: most sources below fall inside the strict last-90-days window (~2026-05-07 through today); a few (Clusters 12, 15) are dated April 2026, ~100-130 days out — kept because the _mechanism_ is evergreen (sourced from Vite's own current, living migration guide, not a dated blog post) and readers hit it now via Astro 7 adoption regardless of Vite 8's original beta/early-patch dates — the same timeliness framing this plan's own published Cluster 1 (`fix-eresolve-vite-8-peer-dependency-astro-7`) already uses successfully.

## Pillar 2

**Astro 7's Vite 8 Upgrade: Rolldown, Oxc, and Lightning CSS Breaking Changes**

- Status: written
- Slug: -
- Why pillar: Astro 7.1.3 (this repo's own pinned version) requires `vite@^8.0.13` — confirmed directly in `package-lock.json`, not assumed. Vite 8 is Vite's biggest architectural change in years: a full swap from esbuild+Rollup to a unified Rust toolchain (Rolldown/Oxc/Lightning CSS), with real, dated breaking changes hitting real Astro/Tailwind/Vite projects throughout the research window — structurally broad enough for 10 distinct, non-overlapping sub-issues without stretching.

## Clusters (Pillar 2)

### 11. Fix Vite 8 Lightning CSS Dropping backdrop-filter

- Status: written
- Slug: fix-vite-8-lightning-css-backdrop-filter
- Search Intent / Signal: [confirmed, verbatim] issue title: "Vite 8 default `cssMinify: 'lightningcss'` drops unprefixed `backdrop-filter`, breaking glass/blur effects (regression vs Vite 7)"
- Structural Problem: Vite 8 flips `build.cssMinify`'s default from esbuild to Lightning CSS. When a stylesheet declares both the standard `backdrop-filter` and a vendor-prefixed `-webkit-backdrop-filter` (the normal cross-browser-safe authoring pattern), Lightning CSS's minifier treats the prefixed rule as sufficient and strips the unprefixed one as redundant — but browsers that don't need the prefix still require the standard property to be present, so glass/blur effects silently vanish in the minified production build while looking correct in `astro dev`.
- Source: [vitejs/vite#22649](https://github.com/vitejs/vite/issues/22649), opened 2026-06-09, closed as duplicate of #21954 (same underlying minifier behavior).
- Interlinks: sibling Cluster 18 (format-sniffing removal) — "what else changed by default in Vite 8's build step." No existing post covers CSS minification.

### 12. Fix @tailwindcss/vite Rolldown Resolver Crash

- Status: written
- Slug: fix-tailwindcss-vite-rolldown-resolver-crash
- Search Intent / Signal: [confirmed, verbatim] `Missing field \`tsconfigPaths\` on BindingViteResolvePluginConfig.resolveOptions`
- Structural Problem: Vite 8's Rolldown-based resolver exposes a native (Rust) plugin-config binding that Vite's public resolver API is supposed to populate before handing it to consuming plugins. In Vite 8.0.10 (`rolldown@1.0.0-rc.17`), that public API stopped populating every field the native binding expects. `@tailwindcss/vite` calls Vite's resolver directly during its build-time CSS-generation step to locate the `tailwindcss` package itself — with the config object incomplete, that lookup crashes instead of resolving.
- Source: [vitejs/vite#22322](https://github.com/vitejs/vite/issues/22322) (opened 2026-04-24) and [withastro/astro#16542](https://github.com/withastro/astro/issues/16542) (opened 2026-04-30, "astro add tailwind installs incompatible @tailwindcss/vite").
- Dogfood note: confirmed **not reproducible** against this repo's own resolved `vite@8.1.5` / `rolldown@1.1.5` / `@tailwindcss/vite@^4.3.3` — `npm run build` completes cleanly with `@tailwindcss/vite` actively wired in `astro.config.mjs`. The resolver gap appears fixed in later Rolldown patches; still worth writing since it's a real, confusing failure mode for anyone on an intermediate Vite 8.0.x patch, and the fix (upgrade Vite/Rolldown) is exactly the kind of actionable, verifiable advice this category is for.
- Interlinks: **fix-eresolve-vite-8-peer-dependency-astro-7** — related but distinct: that post is an npm install-time peer-dependency failure; this is a build-time crash _after_ a successful install.

### 13. Fix Astro Dev Toolbar 'Not Implemented' Crash

- Status: written
- Slug: fix-astro-dev-toolbar-not-implemented-crash
- Search Intent / Signal: [confirmed, verbatim] `"Not implemented"` thrown from `PluginContextImpl.generateBundle` (`vite/dist/node/chunks/node.js`)
- Structural Problem: Vite 8 switched its dependency optimizer from esbuild to Rolldown, shipping an esbuild-plugin compatibility shim so existing `optimizeDeps.esbuildOptions.plugins` keep working. Astro's own built-in dev-toolbar integration registers an esbuild plugin with an `onEnd` callback that reads `result.metafile` — a field the compatibility shim doesn't implement, since Rolldown doesn't produce an esbuild-style metafile. Invoking that callback throws instead of silently no-op-ing.
- Source: [withastro/astro#16636](https://github.com/withastro/astro/issues/16636), opened 2026-05-07, closed as not planned (workaround only: stripping `optimizeDeps.esbuildOptions.plugins` via a `configResolved` hook — the root cause in Astro's dev-toolbar plugin itself was never patched upstream as of this research).
- Interlinks: sibling cluster; mention the official mechanism (`optimizeDeps.esbuildOptions` → `optimizeDeps.rolldownOptions`) documented in Vite's migration guide as the general explanation behind this specific crash.

### 14. Fix Vite 8 CommonJS Default Import Breaking Change

- Status: written
- Slug: fix-vite-8-commonjs-default-import-change
- Search Intent / Signal: [confirmed, verbatim doc text; paraphrased runtime symptom] Vite's own migration guide, verbatim: "Default import handling from CommonJS modules now operates consistently. The default import represents `module.exports` when: the importer is `.mjs` or `.mts`, the closest `package.json` specifies `type: "module"`, the importee's `module.exports.__esModule` is not `true`." Runtime symptom (paraphrased — varies per affected package): a default import that previously resolved to the whole CJS exports object now resolves to something else, producing `TypeError: <x> is not a function` at the call site.
- Structural Problem: Rollup's old CJS interop was permissive and could vary depending on how a module was loaded. Rolldown standardizes it under the strict rule quoted above. Any CJS dependency exporting a single function via `module.exports = fn` without setting `__esModule` — a common older-package pattern — can silently resolve to the wrong value once a project bumps to Vite 8, since nothing about the dependency itself changed.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "CommonJS Interop" section — documents `legacy.inconsistentCjsInterop: true` as the temporary escape hatch.
- Interlinks: none yet.

### 15. Fix Vite 8 resolve.alias customResolver Removal

- Status: written
- Slug: fix-vite-8-resolve-alias-customresolver-removal
- Search Intent / Signal: [confirmed] Vite migration guide, verbatim: "`resolve.alias[].customResolver`: use a custom plugin with `resolveId` hook and `enforce: 'pre'` instead."
- Structural Problem: `resolve.alias` entries could previously supply a `customResolver` function to override how Vite resolved that one aliased path. Vite 8 removes that hook entirely — alias resolution is no longer an extension point, so any plugin or config relying on it must become a real Vite plugin registering its own `resolveId` hook with `enforce: 'pre'`.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "Deprecated Options"; worked, dogfooded-adjacent example: [withastro/astro#17090](https://github.com/withastro/astro/pull/17090), "Fix Vite and Rolldown build warnings in Astro 7," merged 2026-06-18 — Astro's own core hit this directly (its tsconfig-path-alias-in-CSS-`@import`s logic used `customResolver`) and replaced it with two separate `resolveId`/transform-hook plugins, shipped already-fixed in Astro 7.0.0 stable.
- Interlinks: none yet. Frame honestly as "already fixed in Astro 7 core as of 7.0.0 stable" — useful for a reader who saw this warning on an Astro 7 beta, or hits it via a _different_ Vite plugin still using the old API.

### 16. Fix Vite 8's build.rollupOptions Deprecation

- Status: written
- Slug: fix-vite-8-build-rollupoptions-deprecation
- Search Intent / Signal: [confirmed] Vite migration guide, verbatim, listed under "Deprecated Options": "`build.rollupOptions` → `build.rolldownOptions`" (and `worker.rollupOptions` → `worker.rolldownOptions`).
- Structural Problem: Rolldown replaces Rollup as Vite's production bundler, so the config key shaping the underlying bundler's own options is renamed to match. The old key still works today (deprecated, auto-mapped), but any project with a customized `manualChunks`, `external`, or `output` block under `build.rollupOptions` — an extremely common customization — now gets a deprecation warning on every single build.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "Deprecated Options" section.
- Interlinks: sibling Cluster 19 (manualChunks) — the single most common thing people configure inside this renamed key.

### 17. Fix Vite 8 Oxc Not Lowering Native Decorators

- Status: written
- Slug: fix-vite-8-oxc-native-decorators
- Search Intent / Signal: [confirmed, verbatim] Vite migration guide: "The Oxc transformer does not support lowering native decorators."
- Structural Problem: Vite 8 replaces esbuild with Oxc for JavaScript transformation (`esbuild.jsx`-style options move to a new `oxc` option). esbuild could "lower" (downlevel-compile) TC39 native decorator syntax to older, broadly-supported JS for build targets that don't natively support decorators; Oxc's transformer doesn't implement that lowering step at all. A project using native class decorators (a pattern some state-management or DI-style libraries use) that previously built fine can fail or ship unsupported syntax after the Vite 8 bump, with no direct substitute beyond reverting to esbuild for that step.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "Rolldown Integration Changes" / Oxc section.
- Interlinks: none yet.

### 18. Fix Vite 8 Browser/Module Field Resolution Change

- Status: written
- Slug: fix-vite-8-browser-module-field-resolution
- Search Intent / Signal: [confirmed, verbatim] Vite migration guide: "Module resolution using format sniffing (selecting between `browser` and `module` fields based on content) has been removed." The `resolve.mainFields` option ordering is now always respected instead.
- Structural Problem: Some dual-published npm packages ship both a `browser` and a `module` field in `package.json`, pointing at differently-shaped code (e.g. a CJS-flavored `browser` build vs. an ESM `module` build). Vite 7 and earlier could "sniff" the actual file content to pick whichever field's target actually looked like the right format, papering over packages with an inconsistent or misconfigured `package.json`. Vite 8 removes that inference and always follows `resolve.mainFields`'s literal declared order — a package that only worked before because of the sniffing fallback can now resolve to the wrong (or broken) entry point.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "Module Resolution Updates" section.
- Interlinks: sibling Cluster 11 (Lightning CSS defaults) — paired as "two different default-behavior changes in Vite 8's resolution/build step."

### 19. Fix Vite 8 manualChunks Object Form Removed

- Status: written
- Slug: fix-vite-8-manualchunks-object-form-removed
- Search Intent / Signal: [confirmed, verbatim doc text; real-world example verbatim] Vite migration guide: "The object form `output.manualChunks` option is not supported anymore. The function form `output.manualChunks` is deprecated." Real-world failure example: [voidzero-dev/vite-plus#900](https://github.com/voidzero-dev/vite-plus/issues/900), verbatim: "Warning: Invalid output options (1 issue found) - For the 'manualChunks'. Invalid type: Expected Function but received Object." (opened 2026-03-15, closed via PR #1046).
- Structural Problem: Rollup's `output.manualChunks` accepted either a function (chunk-name-per-module callback) or a plain object mapping chunk names to arrays of module IDs. Rolldown only implements the function form — the object-map shorthand, a very common way projects hand-split vendor chunks, is rejected outright. Rolldown's own `codeSplitting` option is the intended replacement, not a like-for-like function-form rewrite.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "Manual Code Splitting" section; real-world confirmation via a migration tool's own validator in the issue above.
- Interlinks: sibling Cluster 16 (`build.rollupOptions` rename) — this is the single most common thing people had configured under that renamed key.

### 20. Fix Vite 8 Externalized require() Behavior Change

- Status: written
- Slug: fix-vite-8-externalized-require-behavior-change
- Search Intent / Signal: [confirmed, verbatim] Vite migration guide: "Require calls for externalized modules are now preserved as require calls and not converted to import statements." Rolldown's `esmExternalRequirePlugin` is documented as the opt-in conversion path back to the old behavior.
- Structural Problem: When a dependency is marked external (not bundled — common for SSR/Node-target builds, and for libraries expecting the consumer to provide certain packages), Vite 7 and earlier rewrote any `require('external-pkg')` call inside bundled code into an ESM `import` statement targeting that external. Vite 8 stops doing that rewrite: a `require()` call now stays a literal `require()` call in the output. Output that's meant to run as ESM (e.g. an `.mjs` build, or any Node context without CJS interop) can throw at runtime if it still contains a bare `require()` that nothing defines, since there's no bundler-level `import`-to-fill-in-`require` shim happening anymore.
- Source: [Migration from v7 | Vite](https://vite.dev/guide/migration), "External Module Requires" section.
- Interlinks: sibling Cluster 14 (CJS interop change) — both concern how Vite 8 handles the CJS/ESM boundary differently from Vite 7, from two different angles (import-side vs. require-side).

### Pillar 2 status summary (2026-08-05, updated)

10/10 cluster slots filled and **all 10 written**. Drafted in sequence 11-20 in a single session after user approval. All pairs the plan called out as siblings were interlinked bidirectionally after both posts existed: Cluster 11 ↔ 18 (default-behavior changes in the same build step), Cluster 16 ↔ 19 (the renamed key and its most common contents), Cluster 14 ↔ 20 (CJS/ESM boundary, import side vs. require side). Two corrections made during drafting, not assumed from the plan: Cluster 13's claim that the crash is "unchanged" on current Astro was checked directly against this repo's own `node_modules/astro/dist/toolbar/vite-plugin-dev-toolbar.js` and turned out to be wrong — the current 7.1.3 dev-toolbar plugin no longer sets `optimizeDeps.esbuildOptions.plugins` at all, so the post was rewritten to say so honestly rather than overclaim a still-live bug. Cluster 20's fix section avoided inventing exact usage syntax for Rolldown's `esmExternalRequirePlugin` (not independently verified) in favor of two confirmed-correct alternatives (don't externalize, or use Node's own `createRequire`), with the plugin mentioned as a third option to verify independently. This pillar is now complete; a future `pillar-cluster` run for `guides-fixes` should research a new (third) pillar rather than add more slots here.
