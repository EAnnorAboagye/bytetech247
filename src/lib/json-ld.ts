import type { CollectionEntry } from "astro:content";
import { siteConfig, type CategorySlug } from "../config";

// Small, plain object shapes rather than a full schema.org type package —
// this file is the single place that assembles JSON-LD from siteConfig +
// post frontmatter (build-spec.md Phase 9), so no template hand-types its
// own copy.
type JsonLdObject = Record<string, unknown>;

function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).href;
}

function organization(): JsonLdObject {
  const org: JsonLdObject = {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  };
  if (siteConfig.defaultOgImage) {
    org.logo = {
      "@type": "ImageObject",
      url: absoluteUrl(siteConfig.defaultOgImage),
    };
  }
  const sameAs = Object.values(siteConfig.social);
  if (sameAs.length > 0) org.sameAs = sameAs;
  return org;
}

function person(): JsonLdObject | undefined {
  // Guard rather than emit a Person with an empty name — matches the same
  // "don't fabricate" rule config.ts already follows.
  if (!siteConfig.author.name) return undefined;
  const p: JsonLdObject = {
    "@type": "Person",
    name: siteConfig.author.name,
    url: absoluteUrl("/about/"),
  };
  const sameAs = Object.values(siteConfig.social);
  if (sameAs.length > 0) p.sameAs = sameAs;
  return p;
}

/**
 * Site-wide blocks (WebSite + SearchAction, Organization) — rendered on
 * every page by BaseLayout, not per-template.
 */
export function siteWideJsonLd(): JsonLdObject[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      ...organization(),
    },
  ];
}

// None of the four locked categories (§9) are time-sensitive — every post
// is BlogPosting, never NewsArticle, unless a genuinely news-type category
// is added to the locked list later. Derived per post from `category`,
// never hardcoded site-wide.
const TIME_SENSITIVE_CATEGORIES = new Set<CategorySlug>([]);

export function articleSchemaType(
  category: CategorySlug,
): "NewsArticle" | "BlogPosting" {
  return TIME_SENSITIVE_CATEGORIES.has(category)
    ? "NewsArticle"
    : "BlogPosting";
}

/**
 * Per-article Article/BlogPosting block. `post.data.coverImage` must
 * already be resolved image metadata (true for any post reached via
 * getCollection/getStaticPaths in a page template — see
 * src/content.config.ts for why it can't be resolved earlier).
 */
export function articleJsonLd(
  post: CollectionEntry<"blog">,
  pageUrl: string,
): JsonLdObject {
  const authorEntry = person();
  const node: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": articleSchemaType(post.data.category),
    headline: post.data.title,
    description: post.data.description,
    image: [absoluteUrl(post.data.coverImage.src)],
    datePublished: post.data.date.toISOString(),
    dateModified: post.data.date.toISOString(),
    publisher: organization(),
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
  if (authorEntry) node.author = authorEntry;
  return node;
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export { absoluteUrl };
