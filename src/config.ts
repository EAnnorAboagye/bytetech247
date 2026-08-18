// Single source of truth for site identity, per build-spec.md §11.
// Every later SEO/OG/JSON-LD/RSS module (Phases 9, 11) reads from here —
// never redeclare these values in a template.

export const CATEGORY_SLUGS = [
  "dev-tools",
  "data-automation",
  "ai-productivity",
  "guides-fixes",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

const CATEGORY_NAMES: Record<CategorySlug, string> = {
  "dev-tools": "Dev Tools",
  "data-automation": "Data & Automation",
  "ai-productivity": "AI Productivity",
  "guides-fixes": "Guides & Fixes",
};

// Same descriptive line about.astro already uses per category — reused here
// (rather than a generic "All {category} posts." boilerplate) as the
// archive page's own meta description and visible intro, so a search
// snippet or social share for /dev-tools/ says something a reader can
// actually act on instead of restating the page's own title back at them.
const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  "dev-tools":
    "Editors, CLIs, Git workflows, and the tooling developers reach for every day.",
  "data-automation":
    "CI/CD, deploy pipelines, and scripts that remove a manual step from someone's week.",
  "ai-productivity":
    "Using AI coding assistants well: prompting, review habits, and where they genuinely help versus where they don't.",
  "guides-fixes":
    "The specific bug, the specific error, the fix that isn't in the official docs yet.",
};

export const CATEGORIES: { slug: CategorySlug; name: string }[] =
  CATEGORY_SLUGS.map((slug) => ({
    slug,
    name: CATEGORY_NAMES[slug],
  }));

export function getCategoryName(slug: string): string {
  return CATEGORY_NAMES[slug as CategorySlug] ?? slug;
}

export function getCategoryDescription(slug: string): string {
  return (
    CATEGORY_DESCRIPTIONS[slug as CategorySlug] ??
    `All ${getCategoryName(slug)} posts.`
  );
}

// /tools/ section, added 2026-08-11 — same static-list shape as
// CATEGORY_SLUGS/CATEGORIES above, one entry per tool, each targeting a
// specific researched SEO opportunity; see the AI Token Counter plan for
// the research behind tool #1. The first two tools are client-side-only;
// mcp-compatibility-checker (added 2026-08-14) is the first with real
// server-side logic (a live probe in worker/index.ts, currently free — see
// MCP_CHECK_FREE_MODE below — behind the same Lemon Squeezy payment
// gating the other two never needed) — the list itself stays the same
// shape either way. Deliberately a plain array here, not a content collection — no
// per-item MDX body, exactly what CATEGORIES already covers for the 4
// content categories.
export const TOOL_SLUGS = [
  "ai-token-counter",
  "llm-pricing-calculator",
  "mcp-compatibility-checker",
] as const;

export type ToolSlug = (typeof TOOL_SLUGS)[number];

const TOOL_NAMES: Record<ToolSlug, string> = {
  "ai-token-counter": "AI Token Counter",
  "llm-pricing-calculator": "LLM Pricing Calculator",
  "mcp-compatibility-checker": "MCP Compatibility Checker",
};

const TOOL_DESCRIPTIONS: Record<ToolSlug, string> = {
  "ai-token-counter":
    "Count tokens for GPT, Claude, and Gemini prompts — exact for GPT, clearly-labeled estimates for Claude and Gemini. Runs entirely in your browser.",
  "llm-pricing-calculator":
    "Compare real dollar costs across GPT-5.6, Claude Opus 4.7/4.8, and Gemini 3.6 Flash, including each provider's prompt-caching math. Runs entirely in your browser.",
  "mcp-compatibility-checker":
    "A free, 7-point live audit of your remote MCP server against the July 2026 spec rewrite, with upgrade guidance for anything that's out of date.",
};

// Temporarily free (2026-08-15) — running with no paywall to build usage and
// reviews before turning billing back on. This is the single switch: flip
// to `false` and redeploy to re-enable the $19.99 Lemon Squeezy checkout
// with zero other code changes anywhere. worker/index.ts's
// handleMcpCheckStart branches on this constant directly; every page/
// component below (tool page, widget, result page) reads it too, so the
// "paid" copy and JSON-LD Offer come back automatically the moment this
// flips — nothing to hunt down and re-word by hand later.
export const MCP_CHECK_FREE_MODE = true;

// One-time price for the MCP Compatibility Checker once MCP_CHECK_FREE_MODE
// is false — this site's first paid tool (see the two free ones above). Set
// at $19.99, a deliberate choice over a cheaper impulse-buy price: the goal
// is a genuinely useful diagnostic worth paying for, not the lowest number
// that clears checkout friction. Keep this in sync by hand with the actual
// Lemon Squeezy variant price (worker/lib/lemon-squeezy.ts creates the
// checkout against that variant directly; there is no live price sync).
export const MCP_CHECK_PRICE_USD = 19.99;

export const TOOLS: { slug: ToolSlug; name: string; description: string }[] =
  TOOL_SLUGS.map((slug) => ({
    slug,
    name: TOOL_NAMES[slug],
    description: TOOL_DESCRIPTIONS[slug],
  }));

export function getToolName(slug: string): string {
  return TOOL_NAMES[slug as ToolSlug] ?? slug;
}

export const siteConfig = {
  name: "ByteTech247",
  url: "https://bytetech247.com",
  // Locked verbatim in build-spec.md §11 — do not reword.
  title: "ByteTech247 | Dev Tools, Automation & AI Productivity",
  // Updated 2026-08-01, superseding build-spec.md §11's original locked
  // text (see that section's changelog note) — a deliberate user
  // decision, not a drift like the earlier unauthorized reword this
  // replaced.
  description:
    "ByteTech247 delivers expert Dev Tools, automation, and AI productivity insights. Get production-ready guides and fixes to optimize your workflows.",
  author: {
    // Resolved in build-spec.md §11 (v3.2) — real author identity.
    name: "Aboagye Annor",
    // Role-based bio, not fabricated credentials (§11's original "leave
    // empty rather than inventing one" guidance was about inventing years
    // of experience or qualifications never supplied — this states his
    // actual role, provided 2026-08-11).
    bio: "Founder, author, and editor of ByteTech247. Writes hands-on guides on developer tools, automation, and AI productivity, testing every command and configuration before it publishes.",
  },
  // Resolved in build-spec.md §11 (v3.2) — real accounts, all @bytetech247.
  social: {
    facebook: "https://www.facebook.com/bytetech247",
    x: "https://x.com/bytetech247",
    instagram: "https://www.instagram.com/bytetech247",
    tiktok: "https://www.tiktok.com/@bytetech247",
  } as Record<string, string>,

  // Dedicated 1200x630 raster OG/Twitter fallback for pages without their
  // own cover (home, about, category/tag pages) — see
  // scripts/make-default-og-image.mjs. SVG isn't reliably rendered as a
  // link-preview image by Facebook, LinkedIn, iMessage, etc., so this must
  // stay a raster format, unlike logoImage below.
  defaultOgImage: "/og-default.png" as string | null,

  // Organization.logo in JSON-LD is a separate concern from the OG/Twitter
  // preview image above: it's deliberately the square 128x128 mark, which
  // clears Google's 112x112 minimum for Organization.logo (build-spec.md
  // §11) — a wide banner image with tagline text isn't a "logo."
  logoImage: "/logo-mark.svg" as string | null,

  // Real contact channels. info@bytetech247.com forwards via Cloudflare
  // Email Routing to the operator's inbox (set up, not yet test-confirmed
  // as of this writing — verify by sending a real email through before
  // relying on it). The form is the same one public/.well-known/security.txt
  // uses for security reports — kept in sync by hand, not templated,
  // since it serves a different purpose (vulnerability reports
  // specifically, not general contact).
  contactEmail: "info@bytetech247.com",
  contactFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeeZu9cdFWVJcncLjnrSG6Xyou-ndQNjynnQ7HeXmVwe3MJcw/viewform",

  // The Privacy/Terms pages are written against this jurisdiction —
  // where the site's operator, Aboagye Annor, is based.
  jurisdiction: "Ghana",

  // GA4 property "ByteTech247" (analytics.google.com) — not a secret;
  // a Measurement ID is inherently public, visible in every page's own
  // source once loaded. Loaded unconditionally in BaseLayout.astro's
  // <head> for every visitor (no consent gate, as of 2026-08-04) — see
  // privacy.astro's "What this site collects today" section, which this
  // ID must stay consistent with.
  analyticsId: "G-QCK9SYFM29",

  // Cloudflare Web Analytics beacon token (dash.cloudflare.com > Web
  // Analytics > this site > Manage Site) — not a secret, same reasoning
  // as analyticsId above. Self-hosted here (Manual Setup) instead of
  // relying on the zone's Automatic Setup, which edge-injects its own
  // copy of this same script *after* our build already ran — that
  // injected version isn't visible to generate-security-headers.mjs at
  // build time, so its inline bootstrap script only stayed CSP-allowed
  // via hardcoded hashes read off a live violation, and broke again the
  // next time Cloudflare changed what it injects (confirmed live,
  // 2026-08-05, twice). Loading it ourselves as a same-repo external
  // <script src>, exactly like gtag.js below, makes it just another
  // host-allowlisted script — nothing to hash, nothing to go stale.
  // Automatic Setup should be turned off in the dashboard once this
  // ships, so the beacon doesn't fire twice per pageview.
  cloudflareBeaconToken: "90df95ac9f614fe1833024011e9e4b03",

  // Google AdSense publisher ID — not a secret, same reasoning as
  // analyticsId above (visible in the page source of every AdSense site).
  // Loaded in BaseLayout.astro's <head>; see worker/index.ts's cspFor()
  // for the nonce + 'strict-dynamic' CSP this requires. BaseLayout.astro's
  // gtag Consent Mode default keeps ad_storage/ad_user_data/
  // ad_personalization denied, so this serves non-personalized ads only
  // until a real Consent Management Platform exists for EEA/UK/Swiss
  // visitors.
  //
  // Must keep the "ca-" prefix — confirmed live in the AdSense dashboard
  // (site verification step, 2026-08-11): the account's own generated
  // snippet uses `client=ca-pub-2225877475261768`, but this value was
  // missing that prefix, so the deployed loader script was requesting
  // `client=pub-2225877475261768` instead — the likely reason the site
  // was still stuck on "Requires review" and no real ad creative was
  // ever seen rendering into the Auto Ads slot despite the script
  // loading fine.
  adsensePublisherId: "ca-pub-2225877475261768",

  // Manual AdSense ad-unit slot IDs (Ads -> By ad unit -> Display ads in
  // the AdSense dashboard, not the Auto Ads toggle) — replaces the
  // zero-control Auto Ads placement with fixed, CLS-safe positions (see
  // src/components/AdSlot.astro). Left empty until the site is actually
  // connected/approved in AdSense: AdSlot renders nothing for an empty
  // string, so this is a safe no-op rather than a broken ad tag.
  //
  // Six real ad units already exist in the AdSense dashboard (created
  // 2026-08-11 — Homepage Header 6454528989, Homepage In Content
  // 1640471997, Article Header 3453227057, Article Sidebar 4574737038,
  // Article In Content 3070083670, Article Post Content 6626185302; see
  // the mapping in the 2026-08-11 commit that first wired these in for
  // which key gets which unit). They were live in this config for a
  // short window that same day and measurably wrecked the site's real
  // performance — Lighthouse CI mobile caught a performance score of
  // 0.35 (was passing before), LCP 5.6s (budget: 3s), TBT 3.1s, with
  // Google/Doubleclick ad-serving scripts alone responsible for ~1.25s
  // of that blocking time — because the site wasn't connected/approved
  // in AdSense yet, so all 8 real ad requests per page were pure
  // overhead with no chance of actually filling. Re-enable these same
  // slot IDs (they don't need to be recreated) once the site shows
  // connected/approved in the AdSense dashboard, and re-run Lighthouse
  // before shipping to confirm the cost is acceptable once ads can
  // actually fill.
  adSlots: {
    // Sidebar tower, under the desktop TOC (article pages only).
    articleSidebar: "",
    // Homepage placements (index.astro): one after the header/before the
    // hero, one after the hero, one after the featured/secondary grid,
    // one after Recent, and one after each of the four category
    // sections — the exact layout requested 2026-08-11.
    homepageHeader: "",
    homepageAfterHero: "",
    homepageAfterFeatured: "",
    homepageAfterRecent: "",
    homepageAfterDevTools: "",
    homepageAfterDataAutomation: "",
    homepageAfterAiProductivity: "",
    homepageAfterGuidesFixes: "",
    // Article page placements ([category]/[slug].astro), in reading
    // order — the exact layout requested 2026-08-11.
    articleHeader: "",
    articleAfterImage: "",
    articleAfterPillarCluster: "",
    articleAfterQuickAnswer: "",
    articleH2: "",
    articleBeforeAuthorBio: "",
    articleAfterTags: "",
    articleBeforeRecent: "",
    // /tools/ pages (e.g. ai-token-counter.astro) — same empty-until-
    // reconnected convention as every key above.
    toolsAfterIntro: "",
    toolsAfterWidget: "",
    toolsBeforeFaq: "",
  } as Record<string, string>,
} as const;

// Maps each category slug to the siteConfig.adSlots key for the ad slot
// that follows its homepage section — kept here rather than inline in
// index.astro's CATEGORIES.map() so the mapping stays next to the
// adSlots keys it has to match.
export const CATEGORY_HOMEPAGE_AD_SLOT: Record<CategorySlug, string> = {
  "dev-tools": "homepageAfterDevTools",
  "data-automation": "homepageAfterDataAutomation",
  "ai-productivity": "homepageAfterAiProductivity",
  "guides-fixes": "homepageAfterGuidesFixes",
};
