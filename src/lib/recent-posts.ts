import type { CollectionEntry } from "astro:content";

const DEFAULT_LIMIT = 3;

/**
 * Freshness/discovery, not topical relevance — deliberately separate from
 * getRelatedPosts (src/lib/related-posts.ts), which scores by tag overlap.
 * A post already shown in Related is excluded here so the two sections
 * never show the same card twice on one page.
 */
export function getRecentPosts(
  currentPost: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[],
  excludeIds: string[] = [],
  limit = DEFAULT_LIMIT,
): CollectionEntry<"blog">[] {
  const exclude = new Set([currentPost.id, ...excludeIds]);
  return allPosts
    .filter((post) => !exclude.has(post.id))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, limit);
}
