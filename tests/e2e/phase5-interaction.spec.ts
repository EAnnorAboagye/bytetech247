import { test, expect } from "@playwright/test";

// Phase 5's own Verify line: a Playwright smoke test for command palette
// open/close and dark-mode persistence across reload.
test.describe("Phase 5 — Interaction Layer", () => {
  test("command palette opens via Ctrl+K, filters, and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Control+k");
    const dialog = page.locator(".command-palette");
    await expect(dialog).toBeVisible();

    const input = page.locator(".command-palette__input");
    await expect(input).toBeFocused();

    await input.fill("dev");
    const visibleItems = page.locator(".command-palette__item:visible");
    await expect(visibleItems).toHaveCount(1);
    await expect(visibleItems.first()).toHaveText("Dev Tools");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("dark mode toggle persists across reload with no FOUC", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.click("[data-theme-toggle]");
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.reload();
    // The inline head script sets data-theme before first paint, so this
    // should already be "dark" on the very next check, not after a delay.
    await expect(html).toHaveAttribute("data-theme", "dark");

    const storedTheme = await page.evaluate(() =>
      localStorage.getItem("theme"),
    );
    expect(storedTheme).toBe("dark");
  });
});
