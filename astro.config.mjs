// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { visit } from "unist-util-visit";

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
  site: "https://bytetech247.workers.dev",
  integrations: [mdx()],
  // markdown.rehypePlugins (not mdx({ rehypePlugins })) — MDX tables only
  // actually got scope="col" applied here, confirmed by inspecting the
  // rendered output; astro logs a deprecation warning pointing at a
  // unified()-based replacement, but the current API is still functional.
  markdown: {
    rehypePlugins: [rehypeTableHeaderScope],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
