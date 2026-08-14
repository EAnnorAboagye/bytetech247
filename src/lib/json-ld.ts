import type { CollectionEntry } from "astro:content";
import { siteConfig, getCategoryName, type CategorySlug } from "../config";
import { countWords } from "./reading-time";

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
  if (siteConfig.logoImage) {
    org.logo = {
      "@type": "ImageObject",
      url: absoluteUrl(siteConfig.logoImage),
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
 *
 * `lastVerifiedDate` is the real dateModified signal (src/lib/last-verified.ts,
 * pulled from the post's own git history) — falling back to datePublished
 * when a file has no commit history yet (freshly added, uncommitted) is
 * correct, but silently claiming every post was "modified" on its
 * publish date forever, even after real edits, is the kind of quiet lie
 * that erodes exactly the trust signal this field exists to provide.
 *
 * `additionalImageSrcs` are pre-generated 4x3 and 1x1 crops of the same
 * cover image (built in [category]/[slug].astro via getImage(), not
 * rendered anywhere on the page) — Google's Article structured data
 * guidelines recommend supplying 16x9, 4x3, and 1x1 versions of the same
 * image "for best results" across its different rich-result surfaces
 * (Search, Discover, Images), not just a single ratio.
 */
export function articleJsonLd(
  post: CollectionEntry<"blog">,
  pageUrl: string,
  lastVerifiedDate: Date | null,
  additionalImageSrcs: string[] = [],
): JsonLdObject {
  const authorEntry = person();
  const node: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": articleSchemaType(post.data.category),
    headline: post.data.title,
    description: post.data.description,
    image: [
      absoluteUrl(post.data.coverImage.src),
      ...additionalImageSrcs.map(absoluteUrl),
    ],
    datePublished: post.data.date.toISOString(),
    dateModified: (lastVerifiedDate ?? post.data.date).toISOString(),
    publisher: organization(),
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    inLanguage: "en-US",
    articleSection: getCategoryName(post.data.category),
    wordCount: countWords(post.body ?? ""),
  };
  if (authorEntry) node.author = authorEntry;
  if (post.data.tags.length > 0) node.keywords = post.data.tags.join(", ");
  return node;
}

/**
 * FAQPage block — only ever built from post.data.faq (src/content.config.ts),
 * the same structured array FaqSection.astro renders, so the visible
 * section and the schema can't drift apart. Callers should only emit this
 * block when the array is non-empty.
 */
export function faqJsonLd(
  faq: { question: string; answer: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * ItemList block for a page whose main content is a list of posts (the
 * homepage's "Recent" feed) — tells crawlers explicitly that the page
 * enumerates these specific articles, rather than leaving that implicit
 * in the rendered <PostCard> grid. `urls` should already be absolute.
 */
export function itemListJsonLd(urls: string[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: urls.map((url, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url,
    })),
  };
}

/**
 * WebApplication block for a /tools/ page — added for the AI Token
 * Counter but shared by design across every future tool, since most of
 * them are the same schema.org shape: a client-side utility. `url` should
 * already be absolute. `offer` defaults to the free $0 offer every tool on
 * this site used until the MCP Compatibility Checker (the first paid
 * one) — the two existing free-tool call sites pass no `offer` and are
 * unaffected by this param existing.
 */
export function webApplicationJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  offer?: { price: string; priceCurrency?: string };
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web-based)",
    offers: {
      "@type": "Offer",
      price: opts.offer?.price ?? "0",
      priceCurrency: opts.offer?.priceCurrency ?? "USD",
    },
  };
}

/**
 * CollectionPage block for a page whose content is a listing of posts
 * rather than a single article — category archives (/dev-tools/) and tag
 * archives (/tag/docker/). Paired with breadcrumbJsonLd() the same way
 * every article page pairs Article + BreadcrumbList, so archive pages
 * stop being the one template with only the sitewide WebSite/Organization
 * blocks and nothing describing the page itself.
 */
export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
  };
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
