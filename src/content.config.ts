import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_SLUGS } from "./config";

// Phase 0 scope: enough schema to prove category-based routing and the
// build pipeline end to end. Phase 3 (Content Engineering) owns the full
// frontmatter schema — relatedSlugs, series, seriesOrder, coverImage,
// coverImageAlt — and extends this schema, it doesn't replace it.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(CATEGORY_SLUGS),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
