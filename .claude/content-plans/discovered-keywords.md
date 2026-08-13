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
