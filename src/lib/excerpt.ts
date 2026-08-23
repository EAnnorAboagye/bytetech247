import type { CollectionEntry } from "astro:content";

const WORD_TARGET = 55;

/**
 * A short, standalone-readable excerpt for a "Keep reading" related-post
 * preview — post.data.description if it stands alone (it's already
 * written for exactly this, capped at 160 chars by content.config.ts), or
 * the first ~55 words of the raw MDX body when description is missing.
 * Word-bounded, never cut mid-word — code fences and heading markers are
 * stripped first so an excerpt never opens mid-code-block.
 */
export function getExcerpt(post: CollectionEntry<"blog">): string {
  const description = post.data.description.trim();
  if (description.length > 0) return description;

  const prose = (post.body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = prose.split(" ").filter(Boolean);
  if (words.length <= WORD_TARGET) return words.join(" ");
  return `${words.slice(0, WORD_TARGET).join(" ")}…`;
}
