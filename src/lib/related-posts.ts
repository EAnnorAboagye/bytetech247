import type { CollectionEntry } from "astro:content";

const DEFAULT_LIMIT = 3;

/**
 * One related-posts system, not two competing ones (build-spec.md Phase 3):
 * `relatedSlugs` is a manual override shown first and capped; any
 * remaining slots are filled automatically by tag-overlap scoring.
 */
export function getRelatedPosts(
  currentPost: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[],
  limit = DEFAULT_LIMIT,
): CollectionEntry<"blog">[] {
  const others = allPosts.filter((post) => post.id !== currentPost.id);
  const byId = new Map(others.map((post) => [post.id, post]));

  const manual: CollectionEntry<"blog">[] = [];
  for (const slug of currentPost.data.relatedSlugs) {
    const match = byId.get(slug);
    if (match) {
      manual.push(match);
      byId.delete(slug);
    }
  }

  const remainingSlots = limit - manual.length;
  if (remainingSlots <= 0) {
    return manual.slice(0, limit);
  }

  const currentTags = new Set(currentPost.data.tags);
  const scored = [...byId.values()]
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => currentTags.has(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.post.data.date.valueOf() - a.post.data.date.valueOf(),
    );

  const automatic = scored.slice(0, remainingSlots).map(({ post }) => post);

  return [...manual, ...automatic];
}
