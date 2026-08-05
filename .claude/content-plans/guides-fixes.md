# Content Plan — Guides & Fixes

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

Target ecosystem: this repo's own stack, read live from `package.json` — `astro@^7.1.3`, `tailwindcss@^4.3.3`, `typescript@^6.0.3`, deployed to Cloudflare Workers via `wrangler`. Research window: real-world sources dated from the Astro 7 v7-beta period (early June 2026) through its 2026-06-22 stable GA and the current 7.1.x line, re-checked against today's date (2026-08-05) — comfortably inside the ~90-day freshness bar. Every date below is the source's own reported date, not the sandbox clock.

Series wiring: every cluster written from this plan uses frontmatter `series: "Astro 7 Upgrade: Breaking Changes and Migration Fixes"` with `seriesOrder` matching its cluster number (1-10), so the site's built-in series navigation (`src/pages/[category]/[slug].astro`) links them together automatically once 2+ exist. Keep the `series` string identical, character for character, across every cluster's frontmatter.

**2026-08-05 update:** a second pillar-cluster research pass, prompted by the current skill spec's "exactly 10 clusters" requirement, found that the original 4-breaking-change scope for this pillar was incomplete — it missed the single biggest Astro 7 breaking change of all: **Sätteri**, the new Rust-based Markdown/MDX engine that became the default processor in the same PR that this pillar was already built around conceptually. That gives this pillar real, non-overlapping structural depth for a full 10 clusters instead of ~4. Clusters 5-10 below are new from this pass; Clusters 1-4 are unchanged. Cluster 3 was replaced — its original premise (a paraphrased, never-verified "getContainerRenderer deprecation warning" claim) is superseded by a better-sourced, verbatim-confirmed bug that also involves `getContainerRenderer`, found during this pass. Ruled out as pillar candidates during this pass, with findings kept in reserve rather than discarded: Tailwind CSS 4.1-4.3.x (too thin, ~3 non-overlapping items, one redundant with Cluster 1), TypeScript 6.0 and ESLint 10 (real material exists for both, but it leans more on secondary-source paraphrase than primary docs — several primary sources, incl. `docs.astro.build` and `expressive-code.com`, 403'd on direct fetch from this environment today and would need a re-attempt), Vitest 3 (stale — the ecosystem has already moved to 4.x/5.0-beta), and wrangler/Cloudflare Workers Static Assets beyond the 404 issue already covered (thin — mostly incremental feature churn, not breaking changes).

## Pillar

**Astro 7 Upgrade: Breaking Changes and Migration Fixes**

- Status: pending
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

- Status: approved
- Slug: -
- Search Intent / Signal: [confirmed, verbatim] `"markdown.gfm" and "markdown.smartypants" are deprecated. Move them onto your processor instead...`
- Structural Problem: Astro's deprecated-config-key check for `markdown.gfm`/`markdown.smartypants` fires whenever the Container API renders MDX content — even in a project that never set either option. It's a false positive triggered by the Container-API-plus-MDX render path itself, not by anything in the reader's actual config, which is what makes it confusing to debug.
- Source: [Deprecation warning with Sätteri + Container API + MDX (#17206)](https://github.com/withastro/astro/issues/17206), opened 2026-06-26, closed via PR #17261.
- Interlinks: series sibling; pair with Cluster 6 above (same "deprecation warning" theme, different keys and triggers — one real, one a false positive).

### 8. Fix Astro 7 Cannot Find Package satteri Error (pnpm)

- Status: approved
- Slug: -
- Search Intent / Signal: [confirmed, verbatim] `Cannot find package 'satteri' imported from .../node_modules/@astrojs/mdx/dist/satteri/index.js`
- Structural Problem: `@astrojs/mdx` statically imports the `satteri` package without declaring it as a direct dependency in its own `package.json` (historically kept only in devDependencies). Under pnpm's strict, isolated `node_modules` layout, the bare import can only resolve by accident via pnpm's internal `.pnpm/node_modules` fallback link; when that link is missing, the build fails outright.
- Source: [`@astrojs/mdx` imports satteri but does not declare it (pnpm ERR_MODULE_NOT_FOUND) (#17371)](https://github.com/withastro/astro/issues/17371), opened 2026-07-13, **still open** as of this research (2026-08-05) — directly affects `@astrojs/mdx@7.0.3`, this repo's exact pinned version. A related fix attempt, PR #17372, was closed without merging on 2026-07-16.
- Interlinks: series sibling; write this one first if timeliness matters — it's the only cluster in this pillar still unresolved upstream. This site itself uses npm (`package-lock.json`), not pnpm, so it isn't directly exposed, but the underlying missing-dependency-declaration bug is real and version-pinned regardless of package manager.

### 9. Fix astro-mermaid Diagrams Breaking Under Astro 7

- Status: pending
- Slug: -
- Search Intent / Signal: [confirmed, verbatim] `markdown.remarkPlugins/rehypePlugins/remarkRehype are set, but your satteri processor doesn't run them.`
- Structural Problem: astro-mermaid's remark transform only registers itself when `markdown.processor` resolves to the legacy `unified()` processor. Under Astro 7's Sätteri default that check never passes, so the plugin never runs — with no error or warning of its own — and ` ```mermaid ` code fences render as plain, unstyled code blocks instead of diagrams.
- Source: [Feature request: Support Astro 7 Sätteri markdown processor (#71)](https://github.com/joesaby/astro-mermaid/issues/71), opened 2026-06-24, closed via PR #72.
- Interlinks: series sibling; frame as a named, concrete worked example, generalizable to any other remark-based diagram or content-transform plugin hitting the same silent no-op.

### 10. Fix Astro 7 Duplicate Heading IDs From Sätteri Bug

- Status: pending
- Slug: -
- Search Intent / Signal: [paraphrased] No verbatim error string — this is a silent-corruption bug (duplicate or incorrect `id` attributes on rendered headings), not a thrown exception or console warning.
- Structural Problem: `satteriHeadingIdsPlugin()` runs automatically as part of Astro 7's default pipeline, but wasn't written to be idempotent. A project that also invokes it manually — for example, to feed a custom table-of-contents component — runs it twice on the same tree, producing duplicate or incorrect heading `id` values instead of one clean pass.
- Source: commit [`3b5e994`](https://github.com/withastro/astro) ("fix(satteri): Make heading-ids plugin idempotent"), part of PR #17165, dated 2026-06-23. Confirmed the commit and its title/intent via search; did not independently open the full diff, so the mechanism above is inferred from the commit message rather than fully verified — re-check the diff before drafting.
- Interlinks: series sibling; relevant to anyone building a custom TOC/heading-anchor component on top of Astro 7's default Markdown output.

---

### Non-pillar note: standalone post (was "Cluster 5" under the old 5-slot count)

The original plan ("Property render Does Not Exist" / stale `.astro/types.d.ts` narrowing to `never`) did not survive verification against this repo's real `astro@7.1.3`:

- `.render()` as an entry method doesn't exist in this site's API at all (`import { render } from "astro:content"` is a standalone function here, not `entry.render()` — that method belongs to Astro's pre-content-layer API).
- The "stale types" mechanism doesn't reproduce either. Tested live: editing `content.config.ts` with the dev server running triggered `Content config changed -> Clearing content store -> Synced content` automatically, and `InferEntrySchema` imports the real schema file directly rather than caching a snapshot, so TypeScript types stay current regardless of sync timing. Never got `never` to actually occur.

Replaced with a verified, real, reproducible error: **[Fix Astro InvalidContentEntryDataError Schema Errors](../../src/content/blog/fix-astro-invalidcontententrydataerror/index.mdx)** (slug: `fix-astro-invalidcontententrydataerror`, status: written). Reproduced 4 distinct causes directly against this repo's own schema (invalid enum, missing required field, wrong type, custom `.refine()`/`.max()` message), plus confirmed the whole build aborts on first invalid entry and that `astro check` catches it too.

This is **not an Astro 7 upgrade regression** (it's evergreen Zod/content-collection validation behavior), so per user decision it ships as a standalone `guides-fixes` post with no `series`/`seriesOrder` — it never filled a numbered slot in this pillar and isn't counted in the 10 clusters above.

### Pillar status summary (2026-08-05)

10/10 cluster slots filled: Clusters 1, 2, 4 written; Clusters 3, 5-10 pending (well-sourced, ready to hand to `write-article` one at a time). Cluster 8 (`#17371`, pnpm) is the only sub-issue still open upstream as of this research — highest timeliness value if writing order matters. Two ruled-out research leads are worth a future targeted pass rather than reuse now: Expressive Code's Sätteri HAST-plugin requirement (couldn't get past a 403 on `expressive-code.com` today) and a possible `smartPunctuation` default-behavior cluster (only pre-Sätteri, out-of-window issues turned up; no in-window verbatim source found).
