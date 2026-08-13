// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { visit } from "unist-util-visit";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
} from "@shikijs/transformers";
import {
  transformerFilename,
  transformerFixCommentContrast,
  rehypeCodeBlockChrome,
} from "./src/build/shiki-plugins.mjs";
import { rehypeQuickAnswer } from "./src/build/rehype-quick-answer.mjs";
import { rehypeInArticleAds } from "./src/build/rehype-in-article-ads.mjs";
import { siteConfig } from "./src/config.ts";

// GFM tables don't emit scope="col" on <th> by default — Phase 3 requires
// it for accessibility/AI-GEO parsing of tabular content. GFM only ever
// puts <th> in the header row, so every <th> is safely a column header.
//
// Every table also gets tabindex="0": the article template's own CSS
// (.article-content table, [category]/[slug].astro) makes a wide table
// horizontally scrollable instead of forcing the whole page wider on a
// narrow viewport — same overflow-x:auto pattern as the AI Token
// Counter's comparison table, where axe-core's scrollable-region-focusable
// rule caught this exact gap live (only at a mobile viewport, via the
// site's mobile-chrome-a11y Playwright project — a table narrow enough to
// never overflow at desktop width never triggers this rule there). A
// scrollable region has to be keyboard-reachable, not just swipeable, so
// this is applied unconditionally rather than only to tables known to
// overflow at some particular width.
function rehypeTableHeaderScope() {
  /** @param {import("hast").Root} tree */
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "th") {
        node.properties = { ...node.properties, scope: "col" };
      }
      if (node.tagName === "table") {
        node.properties = { ...node.properties, tabIndex: 0 };
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://bytetech247.com",
  integrations: [mdx()],
  // markdown.rehypePlugins (not mdx({ rehypePlugins })) — MDX tables only
  // actually got scope="col" applied here, confirmed by inspecting the
  // rendered output; astro logs a deprecation warning pointing at a
  // unified()-based replacement, but the current API is still functional.
  markdown: {
    shikiConfig: {
      // Phase 4: code blocks always render in this one fixed dark theme,
      // regardless of the site's light/dark toggle (Phase 1/5) — a
      // deliberate, documented exception to the token-only color rule
      // (see Part III of build-spec.md). Explicit rather than relying on
      // Astro's own github-dark default, so it can't drift silently.
      theme: "github-dark",
      // No wrap: true — code keeps its exact formatting/indentation and
      // scrolls horizontally instead (same approach as GFM tables).
      transformers: [
        transformerMetaHighlight(),
        transformerNotationDiff(),
        transformerFilename(),
        transformerFixCommentContrast(),
      ],
    },
    rehypePlugins: [
      rehypeTableHeaderScope,
      rehypeCodeBlockChrome,
      rehypeQuickAnswer,
      // Must run after rehypeQuickAnswer — see rehype-in-article-ads.mjs's
      // own comment for why the ordering is load-bearing, not incidental.
      [
        rehypeInArticleAds,
        {
          adClient: siteConfig.adsensePublisherId,
          afterQuickAnswerSlot: siteConfig.adSlots.articleAfterQuickAnswer,
          h2Slot: siteConfig.adSlots.articleH2,
        },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
