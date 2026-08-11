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

export const CATEGORIES: { slug: CategorySlug; name: string }[] =
  CATEGORY_SLUGS.map((slug) => ({
    slug,
    name: CATEGORY_NAMES[slug],
  }));

export function getCategoryName(slug: string): string {
  return CATEGORY_NAMES[slug as CategorySlug] ?? slug;
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
    // A short credentials line is still not supplied — leave empty rather
    // than inventing one (§11: "leave it empty/omitted rather than
    // inventing one").
    bio: "",
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
  analyticsId: "G-QRNX9JBMX4",

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
  // src/components/AdSlot.astro). Left empty until real slot IDs exist:
  // AdSlot renders nothing for an empty string, so this is a safe no-op
  // rather than a broken ad tag until these are filled in.
  // Real manual ad-unit slot IDs, created 2026-08-11 in the AdSense
  // dashboard (Ads > By ad unit > Display ads, all "Responsive" size to
  // match the data-ad-format="auto" / data-full-width-responsive="true"
  // markup AdSlot.astro and rehype-in-article-ads.mjs already emit).
  // Six units cover the 17 named positions below — one per genuinely
  // distinct ad *shape*/context (header leaderboard, in-content break,
  // sidebar skyscraper, post-content break), not one per position, so
  // AdSense's own ad-unit report stays a meaningful before/after/zone
  // comparison instead of 17 near-duplicate rows. Reusing the same slot
  // ID in multiple DOM positions on one page is standard and fully
  // supported by AdSense — the position is set by where the code sits on
  // the page, not by the slot ID itself.
  adSlots: {
    // Sidebar tower, under the desktop TOC (article pages only).
    articleSidebar: "4574737038", // Article - Sidebar
    // Homepage placements (index.astro): one after the header/before the
    // hero, one after the hero, one after the featured/secondary grid,
    // one after Recent, and one after each of the four category
    // sections — the exact layout requested 2026-08-11.
    homepageHeader: "6454528989", // Homepage - Header
    homepageAfterHero: "1640471997", // Homepage - In Content
    homepageAfterFeatured: "1640471997", // Homepage - In Content
    homepageAfterRecent: "1640471997", // Homepage - In Content
    homepageAfterDevTools: "1640471997", // Homepage - In Content
    homepageAfterDataAutomation: "1640471997", // Homepage - In Content
    homepageAfterAiProductivity: "1640471997", // Homepage - In Content
    homepageAfterGuidesFixes: "1640471997", // Homepage - In Content
    // Article page placements ([category]/[slug].astro), in reading
    // order — the exact layout requested 2026-08-11. Header gets its own
    // unit; the four in-reading-flow breaks (after cover image, after
    // pillar/cluster, after Quick Answer, alternating H2s) share "Article
    // - In Content"; the three post-content breaks (before author bio,
    // after tags, before recent) share "Article - Post Content" since
    // readers who reach that zone are a distinct, highly-engaged segment
    // worth tracking separately from mid-read breaks.
    articleHeader: "3453227057", // Article - Header
    articleAfterImage: "3070083670", // Article - In Content
    articleAfterPillarCluster: "3070083670", // Article - In Content
    articleAfterQuickAnswer: "3070083670", // Article - In Content
    articleH2: "3070083670", // Article - In Content
    articleBeforeAuthorBio: "6626185302", // Article - Post Content
    articleAfterTags: "6626185302", // Article - Post Content
    articleBeforeRecent: "6626185302", // Article - Post Content
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
