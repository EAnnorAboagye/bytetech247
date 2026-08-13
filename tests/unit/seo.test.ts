import { describe, it, expect } from "vitest";
import { pageTitle } from "../../src/lib/seo";

// pageTitle backs every article's rendered <title>/og:title/twitter:title —
// content.config.ts caps a post's raw title at 60 chars specifically so
// Google doesn't truncate it, but that check never sees the category
// suffix templates append, so this is the one place that guard actually
// has to hold for the real, final string.
describe("pageTitle", () => {
  it("appends the suffix when the combined string fits maxLength", () => {
    expect(pageTitle("Git Worktrees for Parallel Feature Development", "Dev Tools")).toBe(
      "Git Worktrees for Parallel Feature Development — Dev Tools",
    );
  });

  it("returns the base title unchanged when there is no suffix", () => {
    expect(pageTitle("Some Title")).toBe("Some Title");
  });

  it("drops the suffix when appending it would exceed maxLength", () => {
    const longTitle = "The 2026 LLM Token & Pricing Reset: Full Guide"; // 47 chars
    // + " — Data & Automation" (21 chars) = 68, over the 60-char budget.
    expect(pageTitle(longTitle, "Data & Automation")).toBe(longTitle);
  });

  it("keeps the suffix exactly at the maxLength boundary", () => {
    // base(35) + " — "(3) + suffix(22) = 60, exactly at the limit.
    const base = "b".repeat(35);
    const suffix = "s".repeat(22);
    expect(pageTitle(base, suffix, 60)).toBe(`${base} — ${suffix}`);
  });

  it("drops the suffix one character past the maxLength boundary", () => {
    // base(35) + " — "(3) + suffix(23) = 61, one over the limit.
    const base = "b".repeat(35);
    const suffix = "s".repeat(23);
    expect(pageTitle(base, suffix, 60)).toBe(base);
  });
});
