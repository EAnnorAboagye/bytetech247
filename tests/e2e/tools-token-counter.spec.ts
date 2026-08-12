import { test, expect } from "@playwright/test";

// AI Token Counter (/tools/ai-token-counter/) — see the implementation
// plan's own Verification section for why each of these three checks
// exists specifically:
//   1. The tiktoken chunks must not fire on page load — only on first
//      real interaction, or the "load far less JS than the competition"
//      claim in the page's own copy would be false.
//   2. GPT must read "Exact" and Claude/Gemini must read "Estimated" —
//      the whole point of the tool is not overclaiming precision it
//      doesn't have.
//   3. The widget's DOM gets replaced on client-side (View Transitions)
//      navigation, unlike CommandPalette's document-level listeners —
//      a missed astro:page-load re-arm only breaks on soft navigation,
//      which a plain page.goto() in every other test here would never
//      catch.
test.describe("AI Token Counter", () => {
  test("does not fetch the tokenizer until the textarea is used", async ({
    page,
  }) => {
    const tiktokenRequests: string[] = [];
    page.on("request", (req) => {
      if (/cl100k_base|js-tiktoken|lite\.[A-Za-z0-9]+\.js/.test(req.url())) {
        tiktokenRequests.push(req.url());
      }
    });

    await page.goto("/tools/ai-token-counter/");
    await page.waitForLoadState("networkidle");
    expect(tiktokenRequests).toEqual([]);

    await page.locator("[data-token-counter-input]").fill("hello world");
    await expect(page.locator('[data-provider="gpt"] [data-count]')).toHaveText(
      "2",
      { timeout: 5000 },
    );
    expect(tiktokenRequests.length).toBeGreaterThan(0);
  });

  test("shows GPT as Exact and Claude/Gemini as Estimated, all populated", async ({
    page,
  }) => {
    await page.goto("/tools/ai-token-counter/");

    const gptCard = page.locator('[data-provider="gpt"]');
    const claudeCard = page.locator('[data-provider="claude"]');
    const geminiCard = page.locator('[data-provider="gemini"]');

    await expect(gptCard).toContainText("Exact");
    await expect(claudeCard).toContainText("Estimated");
    await expect(geminiCard).toContainText("Estimated");

    await page
      .locator("[data-token-counter-input]")
      .fill("The quick brown fox jumps over the lazy dog.");

    await expect(gptCard.locator("[data-count]")).not.toHaveText("0", {
      timeout: 5000,
    });
    await expect(claudeCard.locator("[data-count]")).not.toHaveText("0");
    await expect(geminiCard.locator("[data-count]")).not.toHaveText("0");
  });

  test("keeps working after a client-side (soft) navigation away and back", async ({
    page,
  }) => {
    await page.goto("/tools/ai-token-counter/");

    // Real link click, not page.goto() — exercises Astro's View
    // Transitions client-side swap, not a hard reload.
    await page.locator(".site-header__logo").click();
    await expect(page).toHaveURL("/");

    await page
      .locator(".primary-nav--horizontal > li")
      .nth(5)
      .locator("summary")
      .click();
    await page
      .locator(".primary-nav--horizontal > li")
      .nth(5)
      .locator(".primary-nav__tag")
      .first()
      .click();
    await expect(page).toHaveURL("/tools/ai-token-counter/");

    await page.locator("[data-token-counter-input]").fill("soft nav check");
    await expect(
      page.locator('[data-provider="gpt"] [data-count]'),
    ).not.toHaveText("0", { timeout: 5000 });
  });
});
