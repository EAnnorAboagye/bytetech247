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
} as const;
