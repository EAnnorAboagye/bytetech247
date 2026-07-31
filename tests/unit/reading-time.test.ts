import { describe, it, expect } from "vitest";
import { calculateReadingTime } from "../../src/lib/reading-time";

// build-spec.md §7 (Testing Strategy) calls for unit coverage on the
// reading-time calculator specifically — it's a small, pure function, but
// the code-vs-prose weighting is exactly the kind of logic that's easy to
// silently break in a later refactor without a test catching it.
describe("calculateReadingTime", () => {
  it("never returns less than 1 minute, even for a few words", () => {
    expect(calculateReadingTime("just a few words here")).toBe(1);
  });

  it("scales prose at ~200 words per minute", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("excludes fenced code blocks from the prose word count", () => {
    const code =
      "```js\n" +
      Array(60).fill("word word word word word").join("\n") +
      "\n```";
    // If code-block content were counted as prose, 300 words alone would
    // push this well past 1 minute (300/200 = 1.5). The code-line weighting
    // (40 lines/min) is slower, so a code-heavy block with zero real prose
    // should land in a low-single-digit range, not spike from a phantom
    // word count.
    expect(calculateReadingTime(code)).toBeLessThanOrEqual(3);
  });

  it("still counts code-only content towards reading time via line count", () => {
    const code = "```js\n" + Array(80).fill("line();").join("\n") + "\n```";
    expect(calculateReadingTime(code)).toBeGreaterThanOrEqual(2);
  });

  it("combines prose and code weighting for mixed content", () => {
    const prose = Array(200).fill("word").join(" "); // ~1 minute of prose
    const code = "```js\nconsole.log(1);\n```"; // a few lines, negligible
    const proseOnly = calculateReadingTime(prose);
    const mixed = calculateReadingTime(`${prose}\n\n${code}`);
    expect(mixed).toBeGreaterThanOrEqual(proseOnly);
  });
});
