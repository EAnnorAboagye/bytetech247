import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig, CATEGORIES, TOOLS } from "../config";
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
// /archive/ and the legal pages (contact, privacy, terms,
// affiliate-disclosure, editorial-policy) are deliberately absent — they
// all carry <meta name="robots" content="noindex, follow"> (see the
// `noindex` prop on their BaseLayout usage), and a sitemap should only
// ever list URLs you actually want indexed. Listing a noindex URL here
// is a known Search Console "Sitemap contains noindex" warning.
//
// /about/ is NOT in that noindex group (fixed 2026-08-13): every article's
// Person JSON-LD (src/lib/json-ld.ts) names /about/ as the author's
// canonical authority page, so telling Google not to index the exact page
// that schema points at as the credential source was a direct
// contradiction of the E-E-A-T signal the rest of the site builds. See
// src/pages/about.astro.
const STATIC_PATHS: { path: string; file: string }[] = [
  { path: "/", file: "src/pages/index.astro" },
  { path: "/about/", file: "src/pages/about.astro" },
  { path: "/tools/", file: "src/pages/tools/index.astro" },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");

  const maxDate = (candidates: Date[]): Date | null =>
    candidates.length === 0
      ? null
      : new Date(Math.max(...candidates.map((d) => d.getTime())));

  // Real lastmod per post, from the file's own git history — not the
  // frontmatter `date` field, which is set once at drafting time and never
  // bumped when a post is later edited. Confirmed live (2026-08-13): two
  // posts corrected for factual errors that same day still carried their
  // original `date` values (one a day stale, one a week stale), so the
  // sitemap was misreporting lastmod to Google by up to 7 days. Falls back
  // to `date` only if git history is unavailable (a freshly added,
  // uncommitted post), matching this file's existing null-safety pattern
  // rather than dropping the tag for a post that's clearly not stale.
  const postLastmod = new Map(
    posts.map((post) => [
      post.id,
      getLastVerifiedDate(`src/content/blog/${post.id}/index.mdx`) ??
        post.data.date,
    ]),
  );

  const homepageLastmod = maxDate([...postLastmod.values()]);

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
          .map((post) => postLastmod.get(post.id)!),
      );
      return {
        loc: `${siteConfig.url}/${category.slug}/`,
        lastmod: lastmod?.toISOString(),
      };
    }),
    ...TOOLS.map((tool) => ({
      loc: `${siteConfig.url}/tools/${tool.slug}/`,
      lastmod: getLastVerifiedDate(
        `src/pages/tools/${tool.slug}.astro`,
      )?.toISOString(),
    })),
    ...posts.map((post) => ({
      loc: postUrl(post),
      lastmod: postLastmod.get(post.id)!.toISOString(),
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
