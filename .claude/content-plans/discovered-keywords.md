# Discovered Keywords Log

## 2026-08-13 (guides-fixes, up to 5 requested, 60-day window)

- **Vitest 5.0 breaking changes (beta)** (guides-fixes) — Source: github.com/vitest-dev/vitest/releases/tag/v5.0.0-beta.7, 2026-07-24 — Status: handed-to-pillar-cluster (approved 2026-08-13). Note: pre-release beta, not stable — flagged to the user as a real tension against pillar-cluster's "affects most people on the current version" bar, not a hard disqualifier given site precedent for pre-release coverage elsewhere. `.claude/content-plans/guides-fixes.md` is now the source of truth for this pillar's actual progress.

Ruled out this run, not shortlisted (kept here so a future run doesn't re-spend research time on the same dead ends without a reason visible):

- Astro 7.2/7.3/7.4 — not yet released as of 2026-08-13 (latest stable is 7.1.6, 2026-07-29).
- Tailwind CSS 4.4/4.5 — not yet released; nothing new since the 4.3.x material already ruled out in the 2026-08-05 pillar-cluster pass (too thin, ~3 non-overlapping items).
- TypeScript 6.1 — not yet released; only 6.0 exists (2026-03-23), already outside the 60-day window and already assessed as secondary-source-heavy in the 2026-08-05 pass.
- Vitest 4.0 — real breaking changes exist, but the version itself shipped 2025-10-22, ~10 months before this run — outside the 60-day freshness window even though this repo hasn't upgraded to it yet.
- Playwright 1.63/1.64 — not released or not yet indexed as of this run.
- Cloudflare Workers Static Assets / Astro deploy path (beyond the existing `fix-cloudflare-workers-empty-404-astro` post) — only turned up a February 2026 PR (withastro/astro#15694), too old, and already flagged as thin in the 2026-08-05 pass.

## 2026-08-13 (dev-tools + data-automation, up to 5 requested, 60-day window)

Scoped to these two categories specifically to close the content-volume gap against `ai-productivity`/`guides-fixes` (both sitting at roughly double the post count). Both existing pillars in `dev-tools.md` and `data-automation.md` are already complete (10/10 clusters + hub each), so this run researched second, independent pillars for each category rather than adding slots to the first.

- **GitHub Actions security/config breaking changes (June-August 2026 wave)** (dev-tools) — Source: GitHub Changelog, multiple entries — "Safer pull_request_target defaults for GitHub Actions checkout" (2026-06-18), "Minimum version enforcement timeline for self-hosted runners" (2026-06-12, enforcement 2026-07-31), "Control who and what triggers GitHub Actions workflows" (2026-06-18), "GitHub Actions holds potentially malicious workflows for approval" (2026-07-28), "Bot-created pull requests can run workflows if approved" (2026-06-11) — Status: approved, handing off to pillar-cluster now.
- **Zapier integration API deprecation wave** (data-automation) — Source: Zapier Help Center — "Action required: Update your Pipedrive workflows before the V1 API deprecation" (Pipedrive V1 sunset 2026-07-31), "Important update: Zapier Functions is being deprecated" (effective 2026-09-01), plus dated ChatGPT/OpenAI Assistants-API and Element451-integration retirement notices in the same window — Status: approved, handing off to pillar-cluster now.

Ruled out this run, not shortlisted:

- Playwright — latest (1.61, July 2026) explicitly has no breaking changes; 1.59/1.60's breaking changes (macOS 14 WebKit drop, `@playwright/experimental-ct-svelte` removal) are April/May 2026, outside the 60-day window.
- Node.js 25 — released October 2025, already past its own EOL (June 2026) — the opposite of fresh.
- GitHub REST API versioning — latest calendar version (2026-03-10) is 5 months old, outside the window; no newer calendar version found.
- Terraform Cloudflare provider — only one in-window changelog entry found (v5.20.0, 2026-06-12, cloudflare-go v7 SDK bump), too thin alone for a 10-cluster pillar, and would overlap heavily with the already-published Cloudflare API Deprecation Wave pillar's ground.
- n8n — reviewed releases 2.26 through 2.34 (2026-06-09 through 2026-08-04); only one genuine breaking change in-window (Notion node database-ID removal, 2.31, 2026-07-14), too thin alone.
- Stripe API — latest breaking-change version (`2026-03-25.dahlia`) is well outside the 60-day window.

## 2026-08-19 (Google Keyword Planner cross-reference, dev-tools + ai-productivity)

User supplied a real Google Keyword Planner export (Aug 2025-Jul 2026 window, avg. monthly searches + competition data) as a volume/competition signal, cross-referenced against live freshness research per this skill's actual mechanism — the CSV itself has no dates, so nothing was shortlisted on volume alone. Most of the export (thousands of rows) was generic, undated git/github/bitbucket/azure-devops boilerplate ("git clone," "azure devops pipeline," etc.) plus unrelated Keyword-Planner noise (car-loan "repo" terms) — not usable against this skill's freshness/pillar bar. The candidates below are the ones with real volume AND a genuine dated hook found on the live pass.

- **GitHub Copilot's AI Credits promo cliff (Sept 1, 2026)** (ai-productivity) — Keyword: "github copilot" (500,000 avg. monthly searches, Low competition, -90% 3-month change in the CSV — plausibly the pricing-shock backlash itself). Source: GitHub's own docs (usage-based billing for organizations and enterprises, ongoing), github.blog "GitHub Copilot is moving to usage-based billing" (2026-06 series); corroborated by ecorpit.com and Scott Armbruster's write-up dating the promo cliff to 2026-09-01 — existing Business/Enterprise customers' promotional AI Credit allowances (3,000/7,000 per user) drop to standard levels (1,900/3,900) on that date, a 36.7%/44.3% cut with no seat-price change — Status: handed-to-pillar-cluster (2026-08-19). `.claude/content-plans/ai-productivity.md` (Pillar 3) is now the source of truth for this pillar's actual progress.
- **GitHub CLI (`gh`) gains cross-agent skill management + new command sets (summer 2026)** (dev-tools) — Keyword: "github cli" (50,000 avg. monthly searches, Low competition, +900% YoY change in the CSV). Source: github.blog changelog — "Manage agent skills with GitHub CLI" (2026-04-16), "Manage sub-issues, types, and dependencies from GitHub CLI" (2026-06-10); cli/cli release 2.97.0 (2026-07-31) adding a `gh discussion` command set and `gh skill` support across GitHub Copilot, Claude Code, Cursor, Codex, Gemini CLI, and Antigravity — Status: handed-to-pillar-cluster (2026-08-19). `.claude/content-plans/dev-tools.md` (Pillar 3) is now the source of truth for this pillar's actual progress.

Ruled out this run:

- Vitest — direct collision. Already a complete 10-cluster pillar in `guides-fixes.md` (`vitest-5-beta-breaking-changes` + 10 fix posts), despite "vitest" showing real volume (5,000/mo, Low competition) in the CSV.
- "gitlab cli" (50,000 avg. monthly, Low competition, +900% YoY in the CSV) — no clean, distinct dated changelog signal found on the live pass; the one August 2026 hit was a Go package-index re-publish (automated mirroring), not a real feature/release signal. Not shortlisted for lack of a genuine hook, not for lack of volume.
- The CSV's other high-volume/low-competition rows ("develop mobile app," "agile system development," "adaptive software development," b2b agency-shopping terms like "software development company"/"custom business software"/"healthcare software development companies") are generic "intro"/agency-seeking search intent, not structural pillar material — excluded per this skill's own anti-pattern rule, not investigated further.
