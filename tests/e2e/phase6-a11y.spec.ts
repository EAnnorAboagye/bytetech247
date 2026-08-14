import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Phase 6's own Verify line: axe-core run against every page template,
// zero violations. Every real route in the site, not a sample.
const routes = [
  "/",
  "/dev-tools/",
  "/data-automation/",
  "/ai-productivity/",
  "/guides-fixes/",
  "/dev-tools/git-worktrees-parallel-feature-development/",
  "/tools/",
  "/tools/ai-token-counter/",
  "/tools/llm-pricing-calculator/",
  "/tools/mcp-compatibility-checker/",
  "/tools/mcp-compatibility-checker/result/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/affiliate-disclosure/",
  "/editorial-policy/",
  "/archive/",
];

test.describe("Phase 6 — Accessibility (axe-core)", () => {
  for (const route of routes) {
    test(`no a11y violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });
  }

  test("custom 404 page has no a11y violations", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});
