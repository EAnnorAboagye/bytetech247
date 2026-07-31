import type { CollectionEntry } from "astro:content";
import { siteConfig } from "../config";

// Hand-rolled RSS 2.0 rather than pulling in @astrojs/rss — this is the
// entire feed logic in one place, shared by the sitewide and per-category
// feeds (build-spec.md Phase 9), with no extra dependency to keep in sync.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function postUrl(post: CollectionEntry<"blog">): string {
  return `${siteConfig.url}/${post.data.category}/${post.id}/`;
}

export function buildRssFeed(options: {
  title: string;
  description: string;
  feedUrl: string;
  posts: CollectionEntry<"blog">[];
}): string {
  const { title, description, feedUrl, posts } = options;

  const items = posts
    .map((post) => {
      const url = postUrl(post);
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
