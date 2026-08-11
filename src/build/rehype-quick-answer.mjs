// Every post's "Quick Answer" section (the category skills' required
// answer-first opener, for AEO/GEO) was rendering as a plain <h2> +
// paragraphs — identical to every other section, even though it's the
// single most important block on the page for a skimming reader or an
// LLM extracting a summary. Wraps the "Quick Answer" heading and
// everything up to the next heading in a labeled <aside>, so the content
// an answer engine should quote and the box a human eye lands on first
// are the same element, not just adjacent text.
import { visit } from "unist-util-visit";

function textContent(node) {
  if (node.type === "text") return node.value;
  if (!node.children) return "";
  return node.children.map(textContent).join("");
}

export function rehypeQuickAnswer() {
  return (tree) => {
    // Collect matches first, then mutate — splicing children while
    // unist-util-visit is still walking the same array risks either an
    // infinite loop (the new wrapper contains the same "Quick Answer" h2
    // we just matched) or a skipped/duplicated sibling.
    const matches = [];
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName === "h2" &&
        parent != null &&
        index != null &&
        textContent(node).trim() === "Quick Answer"
      ) {
        matches.push({ index, parent });
      }
    });

    for (const { index, parent } of matches) {
      let end = index + 1;
      while (
        end < parent.children.length &&
        !(
          parent.children[end].type === "element" &&
          /^h[1-4]$/.test(parent.children[end].tagName)
        )
      ) {
        end++;
      }

      const group = parent.children.slice(index, end);
      const aside = {
        type: "element",
        tagName: "aside",
        properties: { className: ["quick-answer"], ariaLabel: "Quick answer" },
        children: group,
      };
      parent.children.splice(index, end - index, aside);
    }
  };
}
