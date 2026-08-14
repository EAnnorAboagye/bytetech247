import { test, expect } from "@playwright/test";

// LLM Pricing Calculator (/tools/llm-pricing-calculator/) — mirrors
// tools-token-counter.spec.ts's shape (see that file's own comment for why
// each check exists), plus two checks specific to this tool: the caching
// toggle must actually change the total (catches a "toggle rendered but
// multiplier never wired up" bug), and the Gemini card must show both its
// current and future price (locks in the fix to the site's own stale-
// pricing content bug so it can't silently regress).
test.describe("LLM Pricing Calculator", () => {
  test("does not fetch the tokenizer until paste mode is used", async ({
    page,
  }) => {
    const tiktokenRequests: string[] = [];
    page.on("request", (req) => {
      if (/cl100k_base|js-tiktoken|lite\.[A-Za-z0-9]+\.js/.test(req.url())) {
        tiktokenRequests.push(req.url());
      }
    });

    await page.goto("/tools/llm-pricing-calculator/");
    await page.waitForLoadState("networkidle");
    expect(tiktokenRequests).toEqual([]);

    await page.locator('[data-mode-tab][data-mode="paste"]').click();
    await page.locator("[data-paste-input]").fill("hello world");
    await expect(page.locator('[data-paste-count="gpt"]')).not.toHaveText("0", {
      timeout: 5000,
    });
    expect(tiktokenRequests.length).toBeGreaterThan(0);
  });

  test("manual mode produces non-zero, correctly-labeled totals and picks the actual cheapest", async ({
    page,
  }) => {
    await page.goto("/tools/llm-pricing-calculator/");

    const gptCard = page.locator('[data-provider="gpt"]');
    const claudeCard = page.locator('[data-provider="claude"]');
    const geminiCard = page.locator('[data-provider="gemini"]');

    // Pick the cheapest GPT-5.6 tier (Luna) so Gemini isn't trivially
    // cheapest by construction — a real comparison, not a rigged gimme.
    await gptCard
      .locator("[data-gpt-model-select]")
      .selectOption("gpt-5.6-luna");

    await page.locator("[data-manual-input]").fill("1000000");
    await page.locator("[data-manual-output]").fill("1000000");

    await expect(gptCard.locator('[data-cost="total"]')).not.toHaveText(
      "$0.00",
    );
    await expect(claudeCard.locator('[data-cost="total"]')).not.toHaveText(
      "$0.00",
    );
    await expect(geminiCard.locator('[data-cost="total"]')).not.toHaveText(
      "$0.00",
    );

    // GPT-5.6 Luna ($0.20/$1.20 per 1M) is the cheapest of the three at
    // these token counts — confirms the summary reflects real comparison
    // math, not a hardcoded default.
    await expect(page.locator("[data-cheapest-summary]")).toContainText(
      "GPT-5.6",
    );
  });

  test("toggling the cache mode changes the total for identical token counts", async ({
    page,
  }) => {
    await page.goto("/tools/llm-pricing-calculator/");

    await page.locator("[data-manual-input]").fill("1000000");
    await page.locator("[data-manual-output]").fill("0");
    await page.locator("[data-cached-tokens]").fill("500000");

    const claudeTotal = page.locator(
      '[data-provider="claude"] [data-cost="total"]',
    );

    await page.locator('[data-cache-mode="read"]').check();
    const readTotal = await claudeTotal.textContent();

    await page.locator('[data-cache-mode="write"]').check();
    const writeTotal = await claudeTotal.textContent();

    expect(readTotal).not.toEqual(writeTotal);
  });

  test("Gemini card shows both the current and future price", async ({
    page,
  }) => {
    await page.goto("/tools/llm-pricing-calculator/");

    const geminiCard = page.locator('[data-provider="gemini"]');
    await expect(geminiCard).toContainText("now, through 2026-12-31");
    await expect(geminiCard).toContainText("from 2027-01-01");
  });

  test("keeps working after a client-side (soft) navigation away and back", async ({
    page,
  }) => {
    await page.goto("/tools/llm-pricing-calculator/");

    // Real link click, not page.goto() — exercises Astro's View
    // Transitions client-side swap, not a hard reload.
    await page.locator(".site-header__logo").click();
    await expect(page).toHaveURL("/");

    await page
      .locator(".primary-nav--horizontal > li")
      .nth(5)
      .locator("summary")
      .click();
    // Second tool in TOOL_SLUGS order (ai-token-counter is first) — the
    // token counter's own test uses .first() for the same reason, scoped
    // to this nav item rather than a page-wide role query, since the same
    // link text also appears in the mobile nav's Tools menu.
    await page
      .locator(".primary-nav--horizontal > li")
      .nth(5)
      .locator(".primary-nav__tag")
      .nth(1)
      .click();
    await expect(page).toHaveURL("/tools/llm-pricing-calculator/");

    await page.locator("[data-manual-input]").fill("1000000");
    await expect(
      page.locator('[data-provider="gpt"] [data-cost="total"]'),
    ).not.toHaveText("$0.00", { timeout: 5000 });
  });
});
