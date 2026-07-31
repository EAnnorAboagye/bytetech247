import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_SLUGS } from "./config";

// Phase 3 (Content Engineering) full frontmatter schema. Invalid frontmatter
// fails the build here — it does not silently render wrong (Phase 3 Verify).
//
// coverImage's dimension/aspect-ratio requirements are NOT checked here.
// Astro's content-layer image() field only stores a deferred
// "__ASTRO_IMAGE_..." marker at schema-parse time — real width/height
// metadata isn't resolved until a later, separate build pass swaps the
// marker for the actual imported asset. A .refine() here (chained on
// image() or on the whole object) only ever sees the unresolved marker,
// so validating it here can't work structurally. See
// src/lib/validate-cover-image.ts, called from the post page's
// getStaticPaths() where post.data.coverImage is already the fully
// resolved metadata — that's where this build-fails-on-violation check
// actually lives.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        category: z.enum(CATEGORY_SLUGS),
        tags: z.array(z.string()).default([]),
        // Manual related-posts override, shown first and capped — filled
        // out automatically by tag-overlap scoring (src/lib/related-posts.ts),
        // not a second competing system.
        relatedSlugs: z.array(z.string()).default([]),
        series: z.string().optional(),
        seriesOrder: z.number().int().positive().optional(),
        coverImage: image(),
        // alt describes the image; caption (per-usage, in the Figure
        // component) gives context/attribution — not interchangeable.
        coverImageAlt: z
          .string()
          .min(1, "coverImageAlt is required and cannot be empty"),
      })
      .refine((post) => Boolean(post.series) === Boolean(post.seriesOrder), {
        message: "series and seriesOrder must be provided together",
        path: ["series"],
      }),
});

export const collections = { blog };
