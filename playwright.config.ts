import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
  },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Lighthouse CI gates on the mobile preset, but until this project
    // existed nothing in this suite ever rendered at a mobile viewport —
    // the axe-core a11y suite (phase6-a11y.spec.ts) is viewport-agnostic
    // by nature, so it's the one worth re-running here. Scoped to just
    // that file via testMatch rather than added as a second full project:
    // phase5-interaction.spec.ts and tools-token-counter.spec.ts both hard-
    // code desktop-only nav selectors (e.g. .primary-nav--horizontal),
    // which the mobile <details> disclosure nav genuinely replaces below
    // this site's own responsive breakpoint — re-running those under a
    // narrow viewport would fail on a real, intentional layout difference,
    // not a regression.
    {
      name: "mobile-chrome-a11y",
      testMatch: /phase6-a11y\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],
});
