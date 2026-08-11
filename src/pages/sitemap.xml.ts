import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig, CATEGORIES } from "../config";
import { postUrl } from "../lib/rss";
import { getLastVerifiedDate } from "../lib/last-verified";

// Dynamic, build-time-generated sitemap (build-spec.md Phase 9) — every
// static route plus every post, with accurate per-post lastmod. No
// separate sitemap package: this is a handful of URLs, hand-building the
// XML keeps it dependency-free like the RSS feeds.
//
// Each static path maps to the real source file whose git history gives
// its lastmod (same getLastVerifiedDate git-log mechanism the post pages
// already use), not a manually-bumped date. Category pages and the
// homepage don't have a single meaningful source file the way a static
// page does — their real content is whichever posts they list — so their
// lastmod is the most recent post date among what they show instead.
//
// /archive/ and the legal/about pages (contact, privacy, terms,
// affiliate-disclosure, editorial-policy) are deliberately absent — they
// all carry <meta name="robots" content="noindex, follow"> (see the
// `noindex` prop on their BaseLayout usage), and a sitemap should only
// ever list URLs you actually want indexed. Listing a noindex URL here
// is a known Search Console "Sitemap contains noindex" warning.
const STATIC_PATHS: { path: string; file: string }[] = [
  { path: "/", file: "src/pages/index.astro" },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");

  const maxDate = (candidates: Date[]): Date | null =>
    candidates.length === 0
      ? null
      : new Date(Math.max(...candidates.map((d) => d.getTime())));

  const allPostDates = posts.map((post) => post.data.date);
  const homepageLastmod = maxDate(allPostDates);

  const entries = [
    ...STATIC_PATHS.map(({ path, file }) => {
      const lastmod =
        path === "/" ? homepageLastmod : getLastVerifiedDate(file);
      return {
        loc: `${siteConfig.url}${path}`,
        lastmod: lastmod?.toISOString(),
      };
    }),
    ...CATEGORIES.map((category) => {
      const lastmod = maxDate(
        posts
          .filter((post) => post.data.category === category.slug)
          .map((post) => post.data.date),
      );
      return {
        loc: `${siteConfig.url}/${category.slug}/`,
        lastmod: lastmod?.toISOString(),
      };
    }),
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
