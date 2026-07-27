import type { CollectionEntry } from "astro:content";
import { CATEGORY_SLUGS, type CategorySlug } from "../config";

/**
 * Pure build-time aggregation over the blog collection — no KV, no edge
 * dependency, per build-spec.md Phase 2. Used by the header's per-category
 * <details> disclosure to surface each category's most-used tags.
 */
export function getTopTagsByCategory(
  posts: CollectionEntry<"blog">[],
  limit = 5,
): Record<CategorySlug, string[]> {
  const counts = Object.fromEntries(
    CATEGORY_SLUGS.map((slug) => [slug, new Map<string, number>()]),
  ) as Record<CategorySlug, Map<string, number>>;

  for (const post of posts) {
    const categoryCounts = counts[post.data.category];
    for (const tag of post.data.tags) {
      categoryCounts.set(tag, (categoryCounts.get(tag) ?? 0) + 1);
    }
  }

  const result = {} as Record<CategorySlug, string[]>;
  for (const slug of CATEGORY_SLUGS) {
    result[slug] = [...counts[slug].entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }
  return result;
}
