# Contributing

Content authoring guide for ByteTech247. This is a single-author blog (see `build-spec.md` §8) — this guide assumes direct Git commits, not a multi-author CMS workflow.

## Adding a new post

1. Create `src/content/blog/<slug>/index.mdx`, where `<slug>` is the URL slug (lowercase, hyphenated).
2. Add a cover image at `src/content/blog/<slug>/cover.jpg` — **required**, 16:9 aspect ratio, minimum 1600×900. The build fails if it's missing, undersized, or the wrong aspect ratio (`src/lib/validate-cover-image.ts`).
3. Fill in frontmatter (schema enforced by `src/content.config.ts` — invalid frontmatter fails the build):

```yaml
---
title: "Post title"
description: "One or two sentences — used as the meta description, OG description, and card excerpt."
date: 2026-08-01
category: dev-tools # one of: dev-tools, data-automation, ai-productivity, guides-fixes
tags: ["docker", "git"] # free-form, lowercase-and-hyphenated preferred (drives /tag/[tag])
coverImage: "./cover.jpg"
coverImageAlt: "Describes what's in the image, not the post topic"
# Optional:
relatedSlugs: ["other-post-slug"] # manual related-posts override, shown first
series: "Series name"
seriesOrder: 1 # required together with `series`, not independently
---
```

4. Write the body in MDX. Available components (imported automatically on the post page, no need to import them yourself in the MDX):
   - `<Figure src={...} alt="..." caption="...">` — `alt` is required; use `astro:assets` imports for `src`, not a raw string path.
   - `<Callout type="info|tip|warning|danger" title="...">` — differentiates by icon/label, not color, so don't rely on color alone to convey meaning.
   - `<CodeTabs labels={["a.js", "b.js"]}>` with `<Fragment slot="tab-0">`/`<Fragment slot="tab-1">` children — capped at 6 tabs.
   - `<Benchmark title="..." rows={[{ label: "...", value: 1.2, unit: "s" }]} />` — static bar comparison, no charting library.
   - Standard GFM tables — no component needed, styled automatically with a mobile scroll wrapper and sticky header.

## Image naming convention

Use descriptive, hyphenated filenames for any image referenced in a post body (via `<Figure>`) — `rust-ingest-pipeline-benchmark.png`, not `IMG_4821.png`. This isn't build-enforced, but it's a real (if minor) Google Images signal, and it makes the repo's asset history readable.

## Animated content

Don't drop an animated GIF into a post. Convert it to a muted, autoplay, looping `<video>` (MP4/WebM) first — typically 5–10x smaller for equivalent content, and it goes through a completely different pipeline than `astro:assets` (which only handles static raster images). This is a manual step; nothing in the build catches an accidentally-committed GIF.

## Tags vs. categories

`category` is single, required, and one of four locked values — it's part of the URL. `tags` are free-form and multiple — don't try to force a new "subcategory" into `category`; add a tag instead, and it'll automatically get a `/tag/[tag]` archive page.

## Before opening a PR

```sh
npm run lint
npm run format:check
npm run check
npm run test:unit
npm run build
```

CI runs all of the above plus Playwright/accessibility tests and a Lighthouse CI gate — fix locally first, it's faster to iterate on.
