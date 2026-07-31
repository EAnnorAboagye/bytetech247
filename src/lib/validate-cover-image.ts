import type { CollectionEntry } from "astro:content";

const ASPECT_RATIO_16_9 = 16 / 9;
const ASPECT_RATIO_TOLERANCE = 0.02; // ~2% slack for real-world exports

/**
 * Enforces build-spec.md Phase 3's coverImage requirement (16:9, min
 * 1600x900). Must run somewhere post.data.coverImage is already the
 * resolved image metadata (e.g. a post page's getStaticPaths()) — the
 * content-collection schema itself can't check this, see
 * src/content.config.ts for why. Throws (failing the build) on violation.
 */
export function validateCoverImage(post: CollectionEntry<"blog">): void {
  const { width, height } = post.data.coverImage;

  if (width < 1600 || height < 900) {
    throw new Error(
      `Post "${post.id}": coverImage must be at least 1600x900, got ${width}x${height}`,
    );
  }

  const ratioError =
    Math.abs(width / height - ASPECT_RATIO_16_9) / ASPECT_RATIO_16_9;
  if (ratioError > ASPECT_RATIO_TOLERANCE) {
    throw new Error(
      `Post "${post.id}": coverImage must be a 16:9 source image, got ${width}x${height}`,
    );
  }
}
