// Inserts ad markup at two points that live *inside* the compiled MDX
// body — after the Quick Answer callout, and before every *other*
// qualifying H2 further down (2nd, 4th, 6th...), requested 2026-08-11.
// Both positions are past Astro's own template boundary once <Content />
// renders, so there's no way to place a real <AdSlot> component there
// from [category]/[slug].astro directly — this emits the exact same
// markup shape as AdSlot.astro (styled by the shared .ad-slot rules in
// global.css, activated by the shared script in BaseLayout.astro) as raw
// hast nodes instead. Must run after rehypeQuickAnswer in the pipeline:
// it locates the <aside class="quick-answer"> that plugin produces, and
// relies on the Quick Answer heading no longer being a *direct* child of
// the document root (nested inside that aside instead) to naturally
// exclude it from the "every other H2" count without special-casing it.
//
// "Every other," not every H2: a typical guide post has 4-6 H2 sections
// after Quick Answer — an ad before literally all of them risks Google
// AdSense's own ad-density policy and directly fights the premium,
// distraction-free reading experience this same redesign is for.

function buildAdSlotNode(slot, minHeight, label, adClient) {
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["ad-slot"],
      style: `--ad-slot-min-height: ${minHeight}`,
    },
    children: [
      {
        type: "element",
        tagName: "p",
        properties: { className: ["ad-slot__label"] },
        children: [{ type: "text", value: label }],
      },
      {
        type: "element",
        tagName: "ins",
        properties: {
          className: ["adsbygoogle"],
          style: "display:block;width:100%;height:100%",
          "data-ad-client": adClient,
          "data-ad-slot": slot,
          "data-ad-format": "auto",
          "data-full-width-responsive": "true",
        },
        children: [],
      },
    ],
  };
}

export function rehypeInArticleAds({
  adClient,
  afterQuickAnswerSlot,
  h2Slot,
  minHeight = "250px",
  label = "Advertisement",
} = {}) {
  return (tree) => {
    if (afterQuickAnswerSlot) {
      const quickAnswerIndex = tree.children.findIndex(
        (node) =>
          node.type === "element" &&
          node.tagName === "aside" &&
          Array.isArray(node.properties?.className) &&
          node.properties.className.includes("quick-answer"),
      );
      if (quickAnswerIndex !== -1) {
        tree.children.splice(
          quickAnswerIndex + 1,
          0,
          buildAdSlotNode(afterQuickAnswerSlot, minHeight, label, adClient),
        );
      }
    }

    if (h2Slot) {
      // Only ever looks at tree.children (top-level/direct children of
      // the document root), never descends — the one thing that makes
      // "every other H2" mean "every other section heading," not also
      // catch a stray h2 nested inside some future custom component.
      const h2Indices = [];
      tree.children.forEach((node, index) => {
        if (node.type === "element" && node.tagName === "h2") {
          h2Indices.push(index);
        }
      });

      // 2nd, 4th, 6th... — the 1st remaining H2 right after Quick
      // Answer's own ad is deliberately skipped so two ad slots never
      // land back-to-back with only a heading between them.
      const insertBeforeIndices = h2Indices.filter((_, i) => (i + 1) % 2 === 0);

      // Insert from the end backwards so earlier splices don't shift the
      // indices of ones still to come.
      for (let k = insertBeforeIndices.length - 1; k >= 0; k--) {
        tree.children.splice(
          insertBeforeIndices[k],
          0,
          buildAdSlotNode(h2Slot, minHeight, label, adClient),
        );
      }
    }
  };
}
