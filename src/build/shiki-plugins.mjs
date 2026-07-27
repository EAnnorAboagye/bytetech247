import { visit } from "unist-util-visit";

/**
 * Reads `title="filename.ext"` out of a fenced code block's meta string
 * (` ```js title="app.js" `) and stamps it onto the <pre> Shiki emits, so
 * the rehype plugin below can render a filename tab.
 */
export function transformerFilename() {
  return {
    name: "filename",
    pre(node) {
      const raw = this.options.meta?.__raw ?? "";
      const match = raw.match(/title="([^"]+)"/);
      if (match) {
        node.properties["data-filename"] = match[1];
      }
      return node;
    },
  };
}

/**
 * Wraps every Shiki-generated <pre> in chrome (filename tab + copy
 * button). Reading/selecting the code needs no JS; only the copy button's
 * click behavior does (wired separately as a small progressive-
 * enhancement script, not here).
 */
export function rehypeCodeBlockChrome() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || !parent || typeof index !== "number")
        return;

      // Astro's Shiki integration wraps output in class "astro-code" (not
      // "shiki"), and stores it as a raw `class` string property (not the
      // usual hast `className` array) — confirmed by logging the actual
      // node at build time. Handle both shapes defensively.
      const classAttr = node.properties?.class ?? node.properties?.className;
      const classes = Array.isArray(classAttr)
        ? classAttr
        : String(classAttr ?? "").split(/\s+/);
      if (!classes.includes("astro-code")) return;

      const filename = node.properties?.["data-filename"];

      const header = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block__header"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["code-block__filename"] },
            children: filename
              ? [{ type: "text", value: String(filename) }]
              : [],
          },
          {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              className: ["code-block__copy"],
              "data-copy-button": "",
            },
            children: [{ type: "text", value: "Copy" }],
          },
        ],
      };

      const wrapper = {
        type: "element",
        tagName: "div",
        properties: {
          className: filename
            ? ["code-block", "code-block--has-filename"]
            : ["code-block"],
        },
        children: [header, node],
      };

      parent.children[index] = wrapper;
    });
  };
}
