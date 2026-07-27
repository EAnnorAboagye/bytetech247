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
  url: "https://bytetech247.workers.dev",
  // Locked verbatim in build-spec.md §11 — do not reword.
  title: "ByteTech247 | Dev Tools, Automation & AI Productivity",
  description:
    "ByteTech247 delivers expert Dev Tools, Data & Automation, and AI Productivity insights. Get production-ready Guides & Fixes to optimize your technical workflows.",
  author: {
    // Open item (build-spec.md §11): real author name/bio not yet supplied.
    // Do not fabricate a name here — Phase 9 fills this in once provided.
    name: "",
    bio: "",
  },
  social: {} as Record<string, string>,
  // Open item (build-spec.md §11): no real social/GitHub handles registered
  // yet. Do not invent a placeholder @bytetech247 handle on any platform.

  // Open item (build-spec.md §11 / Phase 10-11): real OG fallback asset not
  // yet supplied.
  defaultOgImage: null as string | null,
} as const;
