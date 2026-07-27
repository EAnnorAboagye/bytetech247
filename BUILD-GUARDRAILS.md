# Build Guardrails — Do / Don't by Phase

**Companion to:** build-spec.md (ByteTech247 — Build Spec, v3.1)
**Purpose:** build-spec.md says what to build. This document says what NOT to do while building it. Read the matching phase section here immediately before starting that phase — most AI-agent build drift happens in the gaps a spec leaves unstated, and this exists to close those gaps explicitly.

**How to use this:** For each phase, "Builds" is a one-line reminder of scope (full detail is in build-spec.md — don't treat this doc as a replacement for it). "Do" is a condensed checklist of what must be true. "Don't" is the list of specific mistakes to avoid — most of these are decisions that were deliberately made one way after considering the alternative, not arbitrary rules, so don't "fix" them back to the more obvious-seeming default.

---

## Cross-cutting rules (apply in every phase, not just one)

**Do:**
- Treat static-first as the default for everything. Workers/edge functions are the exception (OG image, counters, redirects, paywall gate) — never the mechanism for rendering article content.
- Confirm the phase's own Verify step actually passes before marking it done and moving on.
- Keep the Environment Variables inventory (Part I §5) in sync the moment any phase introduces a new credential.

**Don't:**
- Don't let a Worker or KV failure affect article content. Auxiliary features (a counter, a gate check) can degrade; the article itself never should.
- Don't mark a phase complete because it "mostly works" or compiles. Definition of Done requires the build to pass, Lighthouse to pass, and the phase's specific Verify line to pass — scaffolded-and-half-done fails all three even if nothing errors.
- Don't start a phase before its milestone dependency is fully Verified (Part 0 sequencing rules).
- Don't hardcode a color, spacing, or motion value outside the Phase 1 token layer anywhere in a later phase. There is exactly one documented exception (the Phase 4 code-block theme) — don't invent a second one without updating Part III.
- Don't reintroduce the old project name ("Advanced Tech Blog") anywhere — config, meta tags, JSON-LD, footer copyright, README, package name. The project is **ByteTech247** (v3.1 rebrand, §11).
- Don't deploy this project on Cloudflare Pages, and don't scaffold a Pages project by habit. The locked live URL `bytetech247.workers.dev` is only issuable to a standalone Cloudflare Worker — Pages is architecturally ruled out here, not just unused by convention.
- Don't split the OG-image, counter, redirect, and paywall-gate logic into separate Workers. They're route branches inside the single deployed `bytetech247` Worker's `fetch()` handler (Phase 11), falling through to static-asset serving for everything else.

---

## Phase 0 — Project Scaffold

**Builds:** Astro project skeleton, site config source of truth, static pages the footer depends on, custom 404.

**Do:**
- Read canonical URL, site name, description, author, socials, default OG image from `src/config.ts` everywhere — never re-declare them per template.
- Ship About, Contact, Privacy, Terms & Conditions, Affiliate/Advertising Disclosure, Editorial Policy, and an archive route, all as real pages before Phase 0 is marked Verified.

**Don't:**
- Don't hardcode site metadata in individual templates "just for now" — every later SEO/OG/JSON-LD/RSS module depends on `src/config.ts` being the only source.
- Don't leave any footer or nav link pointing at a route that doesn't exist yet. Verify explicitly checks this — a 404 behind a footer link is a failed phase, not a follow-up task.
- Don't build a dynamic `/about/[author]` route. This is a single-author blog (§8) — `/about` is static and doubles as the author bio page (Phase 9), not two separate routes.
- Don't skip the custom 404 in favor of Cloudflare's default error page.

---

## Phase 1 — Design Token System

**Builds:** The only source of color, type, spacing, and motion values for the entire site.

**Do:**
- Generate light/dark from one OKLCH source, not two independently authored palettes.
- Run the WCAG AA contrast-ratio pass before locking values into this phase — not after.
- Use `clamp()`-driven fluid typography, not a fixed pixel scale with manual breakpoint overrides.

**Don't:**
- Don't lock OKLCH values without the contrast pass — that's an explicit action item in the spec, not an afterthought.
- Don't let any component built in a later phase introduce its own one-off color or spacing value "just this once."

---

## Phase 2 — Layout Primitives & Component System

**Builds:** Stack/Cluster/Grid/Center primitives, CVA component variants, header/footer/nav, post card, author bio, homepage composition.

**Do:**
- Build the homepage as: bento hero → `Recent` → per-category sections, using existing `Grid`/`Stack` primitives.
- Build the category nav dropdown data (top tags per category) as a build-time aggregation over Phase 3 frontmatter — no new infra.
- Verify every component renders correctly with zero JS — this check starts here, not Phase 7.

**Don't:**
- Don't build a `TrendingList` component or a homepage Trending section in this phase. Trending is Phase 13, deliberately deferred — it needs real traffic data to rank anything meaningfully, and building it here means shipping infrastructure that displays nothing for weeks.
- Don't wire the category nav dropdown as a JS-driven menu. It's a native `<details>/<summary>` disclosure — every link is a real `<a href>` in the DOM whether it's open or closed.
- Don't build any base component that only renders correctly once JS hydrates.

---

## Phase 3 — Content Engineering (MDX)

**Builds:** MDX components, frontmatter schema, tables, related-posts logic, reading time.

**Do:**
- Make `alt` a non-optional prop on `<Figure>` — build/type error if omitted.
- Make `category`, `coverImage` (16:9, min. 1600×900), and `coverImageAlt` required fields, validated by a Zod schema that fails the build on violation.
- Style GFM markdown tables with a mobile scroll wrapper, sticky header, and semantic `<th scope="col">` — no component import required.
- Treat `relatedSlugs` as a manual override (shown first, capped) with automatic tag-based fill for remaining slots.

**Don't:**
- Don't use the HTML `title` attribute for image SEO — it carries no meaningful weight; don't spend build effort making it a required field when `alt` is what actually matters.
- Don't accept a `category` value outside the four locked ones (Dev Tools, Data & Automation, AI Productivity, Guides & Fixes) — enum-validated, not free text.
- Don't let a post publish without a `coverImage` — it's required, not "if any."
- Don't treat `relatedSlugs` and the automatic related-posts calculator as two separate, competing systems.
- Don't let a table cause full-page horizontal scroll on mobile — the scroll wrapper is scoped to the table itself.

---

## Phase 4 — Code Block Engineering

**Builds:** Shiki highlighting, code block chrome (line numbers, diff, copy button, file tabs).

**Do:**
- Render code blocks in a single fixed dark theme regardless of site-wide light/dark mode.
- Make the copy button swap "Copy" → "Copied!" for ~2000ms on click.
- Re-run Lighthouse CI after this phase specifically.

**Don't:**
- Don't make the code-block theme follow the site's dark-mode toggle. This is a deliberate, documented exception to the token-only color rule (Part III) — not a bug to "fix" toward consistency later.
- Don't skip the Lighthouse re-run here — code blocks are called out specifically as a common source of unexpected JS weight.

---

## Phase 5 — Interaction Layer

**Builds:** View Transitions, reading progress bar, command palette, dark-mode toggle.

**Do:**
- Implement dark-mode detection with an inline `<head>` script so there's no flash of the wrong theme.
- Respect `prefers-reduced-motion` on the reading progress bar and transitions.

**Don't:**
- Don't implement dark mode as a post-hydration client-side toggle — that's exactly what causes FOUC.
- Don't treat anything built here as required for first render. These are enhancements layered on a baseline that already works without them (confirmed in Phase 7, but the constraint applies starting here).

---

## Phase 6 — Accessibility Architecture

**Builds:** Skip links, landmarks, focus management, contrast, touch targets.

**Do:**
- Explicitly manage focus on View Transitions route changes.
- Enforce a minimum 24×24px touch target (WCAG 2.5.8 AA) on every interactive element, with adequate spacing between adjacent ones.

**Don't:**
- Don't assume View Transitions handles focus correctly by default — it can trap focus if unhandled, and this phase is where that gets fixed, not discovered in QA later.
- Don't ship a touch target under 24×24px, or crowd two targets close enough to cause mis-taps, and call it "close enough" to WCAG AA.

---

## Phase 7 — Progressive Enhancement Baseline

**Builds:** Nothing new — this phase verifies zero-JS usability across everything built so far.

**Do:**
- Manually test every article, nav path, and code block with JS disabled in dev tools.

**Don't:**
- Don't treat this phase as the first opportunity to make something JS-optional. If something built in Phases 2–5 actually required JS to be usable, that's a defect introduced earlier, not something to patch here.

---

## Phase 8 — Search

**Builds:** Pagefind index, search UI in the command palette.

**Do:**
- Wire Pagefind as a postbuild step (`astro build && pagefind --site dist`).

**Don't:**
- Don't build or reach for a server-side search backend. Pagefind runs entirely client-side against a static index — introducing a search API or database here contradicts the whole static-first architecture.

---

## Phase 9 — SEO / AEO / GEO Structure

**Builds:** JSON-LD stack, author/editorial pages, meta tags, llms.txt, markdown export, feeds.

**Do:**
- Derive article schema type (`NewsArticle` vs `BlogPosting`/`TechArticle`) from each post's `category` field, every time.
- Include `Organization`/publisher JSON-LD on every article, plus `Person` schema with `url` and `sameAs`.
- Render the author bio directly on `/about` (Phase 0's existing route) and back it with the `Person` JSON-LD.
- Generate one RSS feed per category, plus the sitewide feed.

**Don't:**
- Don't hardcode article schema to `BlogPosting` site-wide. It must follow the category rule — and don't apply `NewsArticle` to any post in the current four categories, since none of them are genuinely time-sensitive.
- Don't ship Article schema without the `Organization`/publisher block — author markup alone doesn't earn full rich-result eligibility.
- Don't build a second, separate author page. `/about` already exists (Phase 0) — this phase renders the bio there, it doesn't create `/about/[author]`.
- Don't let `llms.txt` exceed ~8KB or drift out of alignment with the JSON-LD descriptions elsewhere on the site.

---

## Phase 10 — Performance Gates

**Builds:** Image pipeline, loading strategy, Lighthouse CI gate.

**Do:**
- Accept any common raster source format and let `astro:assets` handle AVIF/WebP/JPEG output — don't require authors to pre-convert.
- Convert any animated GIF to a muted, autoplay, looping video — this is a manual authoring step, not something the pipeline does automatically.
- Gate Lighthouse CI on the mobile device preset as the pass/fail signal.

**Don't:**
- Don't gate the build on the desktop Lighthouse preset. Google indexes mobile-first — mobile is the actual gate; desktop runs for visibility only.
- Don't run an animated GIF through the static `astro:assets` pipeline and call it optimized — it needs to become a video first.
- Don't upload separate source images per placement (hero tile vs. grid card vs. article header). One required 16:9 source, cropped per placement via `object-fit: cover`.
- Don't pre-select a fixed compression quality percentage. Let the mobile Lighthouse gate drive tightening, since that's the actual constraint that matters.
- Don't build the Trending thumbnail crop in this phase — it's listed for Phase 13, post-launch.

---

## Phase 11 — Cloudflare Infrastructure

**Builds:** Deployment, OG image Worker, KV counters, IndexNow, search-engine verification, analytics.

**Do:**
- Cache the OG image at the edge after first generation per post; purge only when that post's content changes.
- Batch/debounce counter writes client-side before flushing to KV on an interval.
- Verify Google Search Console and Bing Webmaster Tools via DNS TXT record before relying on either.

**Don't:**
- Don't regenerate the OG image on every request — it's cache-first, generated once per post.
- Don't write to KV on every single pageview. The free tier's 1,000 writes/day limit is easy to exceed well before "real scale" — batching is the default for this reason, not a later optimization.
- Don't treat the IndexNow ping as covering Google. It only reaches Bing/Yandex — Google needs the separate Search Console verification and sitemap submission.
- Don't skip DNS TXT verification and go straight to the optional sitemap-resubmission Action — the Action assumes verification is already done.
- Don't add Cloudflare D1 by default. Only if native comments explicitly replace Giscus, or membership state genuinely outgrows KV.
- Don't wire up a Git-push-triggers-Pages-build integration. Deploy is `wrangler deploy` as an explicit CI step — there is no Pages project to auto-build.
- Don't assume the `_headers` file (Phase 13 security headers) covers the OG/redirect/counter/gate routes. Cloudflare's own docs confirm `_headers` rules only apply to static-asset responses — Worker-code-generated responses need their headers set explicitly in the route handler.

---

## Phase 12 — Documentation

**Builds:** README, ARCHITECTURE.md, CONTRIBUTING.md, ADRs, design-system catalog.

**Do:**
- Make sure a new contributor can clone the repo and get a working local build using only README.md.
- Document the image filename convention and the animated-GIF-to-video conversion step in CONTRIBUTING.md.

**Don't:**
- Don't let the README require tribal knowledge (a Slack message, a verbal explanation) to get a build running — that's the literal Verify bar for this phase.
- Don't let the Environment Variables inventory (Part I §5) fall out of sync with what previous phases actually introduced.

---

## Phase 13 — Advanced Add-Ons (post-launch)

**Builds:** Semantic related-posts, Trending, freshness signals, security headers, broken-link checker, sortable tables.

**Do:**
- Ship semantic related-posts first — it's called out as the highest-value differentiator in this phase.
- Build Trending as a build-time calculator + scheduled rebuild, not a live per-request fetch.
- Ship each add-on behind its own commit/PR.

**Don't:**
- Don't start this phase before the site has real content and traffic. Several items here — Trending, analytics-driven internal linking — are meaningless without live data.
- Don't write the CSP here and consider it final. It must be revisited after every Phase 14 addition, or it will silently block ad/Stripe/GA4 scripts rather than erroring loudly.
- Don't implement Trending as a live edge fetch. Same resilience principle as the rest of the site — a live dependency here would be new, and deliberately avoided.
- Don't bundle multiple add-ons into one commit — each needs to be independently bisectable if it causes a regression.

---

## Phase 14 — Monetization Infrastructure (optional)

**Builds:** Ads, affiliate links, membership, newsletter, GA4.

**Do:**
- Treat this phase as requiring a deliberate business decision to start — it is explicitly not required for launch.
- Add `rel="sponsored nofollow"` and `target="_blank"` automatically on every affiliate anchor.
- Gate GA4 behind actual cookie consent, and update the CSP allowlist for every new third-party script origin added in this phase.

**Don't:**
- Don't start Phase 14 by default just because MVP is done — M7 is explicitly optional and traffic-gated.
- Don't load GA4 (or any ad network script) behind a disclosure notice instead of real consent. GDPR/CCPA requires gating the script itself, not just disclosing that it exists.
- Don't embed Stripe payment JS directly on the page — redirect-based Checkout only, to protect the zero-JS baseline.
- Don't add every revenue stream at once. One sub-item at a time, re-running Lighthouse and the CSP check after each — this phase carries the highest risk of silent performance regression and silent CSP breakage in the whole spec.

---

## Cross-cutting: Content Taxonomy (§9)

**Don't:**
- Don't add, rename, or remove a category without re-reading the sequencing rule first — categories are baked into the URL (`/category/slug`), so a change means new URLs, redirects, and updated sitemap/JSON-LD, not a quick edit.
- Don't implement tags as nested subcategories (`/category/subcategory/slug`). Tags are deliberately flat — a `/tag/[tag]` page gives the same discoverability without the routing complexity.
- Don't start Phase 3 content authoring before the category list is locked. (It is: Dev Tools, Data & Automation, AI Productivity, Guides & Fixes — don't relitigate this without a real reason.)

## Cross-cutting: Header, Footer & Navigation (§10)

**Don't:**
- Don't implement the category nav as a JS-dependent dropdown menu.
- Don't implement the article back-arrow with `history.back()` — reuse the breadcrumb's category `href` instead, so it works with JS disabled and always goes somewhere predictable.
- Don't default the header to sticky-on-scroll. Static is the baseline; sticky is an explicit, considered upgrade (Phase 13), not something to add by default because it "feels modern."
