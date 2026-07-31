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

// GFM tables don't emit scope="col" on <th> by default — Phase 3 requires
// it for accessibility/AI-GEO parsing of tabular content. GFM only ever
// puts <th> in the header row, so every <th> is safely a column header.
function rehypeTableHeaderScope() {
  /** @param {import("hast").Root} tree */
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "th") {
        node.properties = { ...node.properties, scope: "col" };
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
    rehypePlugins: [rehypeTableHeaderScope, rehypeCodeBlockChrome],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
