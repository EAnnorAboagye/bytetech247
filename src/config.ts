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
  description:
    "ByteTech247 delivers expert Dev Tools, Data & Automation, and AI Productivity insights. Get production-ready Guides & Fixes to optimize your technical workflows.",
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
} as const;
