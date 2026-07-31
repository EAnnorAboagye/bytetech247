import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig, CATEGORIES } from "../config";
import { postUrl } from "../lib/rss";

// Dynamic, build-time-generated sitemap (build-spec.md Phase 9) — every
// static route plus every post, with accurate per-post lastmod. No
// separate sitemap package: this is a handful of URLs, hand-building the
// XML keeps it dependency-free like the RSS feeds.
const STATIC_PATHS = [
  "/",
  "/archive/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/affiliate-disclosure/",
  "/editorial-policy/",
  ...CATEGORIES.map((category) => `/${category.slug}/`),
];

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");

  const entries = [
    ...STATIC_PATHS.map((path) => ({
      loc: `${siteConfig.url}${path}`,
      lastmod: undefined as string | undefined,
    })),
    ...posts.map((post) => ({
      loc: postUrl(post),
      lastmod: post.data.date.toISOString(),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>${
        entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
      }\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
