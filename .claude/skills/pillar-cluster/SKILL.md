---
name: pillar-cluster
description: Research and draft a Topic Cluster (1 Core Pillar + 10 Sub-Topic Clusters) for a ByteTech247 content category, grounded in live GitHub issues, changelogs, and search trends. Use whenever asked to plan a content cluster, topic map, or pillar/cluster strategy for dev-tools, data-automation, ai-productivity, or guides-fixes — this produces the plan only, not the articles (hand approved clusters to the write-article skill one at a time).
---

This is the planning stage that runs _before_ `write-article`. It answers "what should we write and why will it rank" — never the drafting itself. Output is a Pillar + 10 Clusters map the user reviews and approves before any article gets written.

## 1. Resolve inputs before researching

- **Category** (required) — must be exactly one of the four slugs in `src/config.ts`: `dev-tools`, `data-automation`, `ai-productivity`, `guides-fixes`. If the user names a topic instead of a slug, map it yourself and say which slug you picked. A pillar/cluster plan that doesn't map cleanly to one of these four will fail `content.config.ts`'s `category: z.enum(CATEGORY_SLUGS)` build check the moment anyone drafts it — catch that here, not at build time.
- **Target ecosystem** — default to the site's _own_ stack, read live from `package.json` and `wrangler.jsonc`/deploy config, not a guessed or generic stack. Dogfooding gives first-person authority ("we hit this in our own build") that a generic pick can't, and it's why `guides-fixes` pillars should almost always trace back to Astro, Tailwind, TypeScript, or the Cloudflare Workers deploy path this repo actually runs. For categories where the site's own dependencies don't cover the ground (e.g. a `dev-tools` piece on a CLI ByteTech247 doesn't itself run), the user's stated target stands, but say so explicitly rather than silently substituting a generic pick.
- **Window** — "active right now" means sourced from the last ~90 days of _real_ calendar time (GitHub issues, release notes, changelogs, StackOverflow trends), not the sandbox's system date. Check the actual publish/commit date on anything you cite.

## 2. Live research (do not skip — this is the whole point)

Use real web search against GitHub issue trackers, official changelogs, and release notes for the target ecosystem. For each candidate breaking point, capture:

- The exact source (issue number, changelog entry, discussion thread) and its real date.
- Whether the reported symptom includes a **literal, copy-pasteable string** (an error message, a console warning) — this is a confirmed-verbatim signal. If you only have a described symptom ("spacing disappears after upgrading") with no literal string in the source, that's a paraphrased signal, not verbatim — label it as such in the output. Never invent a fake "verbatim" error string; half the AEO value is matching the exact text a developer pastes into a search bar, and a fabricated one matches nothing.
- A dated source (issue/changelog/thread) must fall inside the freshness window to prove a cluster is "active right now" — but a framework's own living, official docs page (e.g. its current migration guide) is a different citation class: it has no publish date to check because it's continuously maintained. Citing one as the mechanism source is fine as long as at least one dated, in-window source (even a beta-era issue) corroborates that real people are hitting it now — don't let the doc page be the _only_ evidence of timeliness.
- If a docs site 403s a direct fetch (common with framework doc sites), try the raw source file on GitHub before ruling it out as a primary source — confirmed working today: `vite.dev/guide/migration` 403'd, but `raw.githubusercontent.com/<org>/<repo>/main/docs/guide/migration.md` returned the same content cleanly. Most open-source framework docs are markdown files in the project's own repo.

## 3. Existing-content collision check

Before finalizing anything, check `src/content/blog/*/index.mdx` frontmatter (`category`, `tags`, `title`) for topics that already cover the ground a candidate cluster would cover. If a real overlap exists:

- Prefer folding the new angle into the existing post (flag this to the user as "extend X" rather than "new cluster").
- If the cluster is genuinely a distinct angle on the same underlying topic (e.g. a follow-up runtime error vs. the original setup post), keep it as its own cluster but name the existing post it should link to/from — this becomes the interlink field in step 5.

Never let a generated pillar/cluster plan silently duplicate a slug that already exists.

## 4. Select the pillar

One core, structural, high-volume breaking point — never a generic "how to learn X" or "introduction to Y" concept. It should be the kind of thing that:

- Affects most people on the current major/minor version of the target ecosystem, not an edge case.
- Is timely (inside the research window from step 1), so the cluster reads as "active right now," not evergreen filler.
- Is broad enough structurally to genuinely support 10 distinct, non-overlapping sub-errors underneath it — if you're stretching to find a tenth cluster, the pillar is too narrow.

## 5. Generate exactly 10 clusters

Each cluster needs all of these fields — this is stricter than the original prompt template specifically to close gaps found running it:

- **Search Intent / Signal** — the verbatim error string (marked confirmed) or the described symptom (marked paraphrased), per step 2.
- **Structural Technical Problem Explained** — why this happens mechanically, not just what the symptom looks like. A reader should understand the root cause, not just recognize the error.
- **Proposed H1** — phrased the way someone would actually search, **60 characters or fewer** (matches `content.config.ts`'s title cap enforced in `write-article`, so the eventual draft never needs retitling).
- **Source + date** — the issue/changelog/thread and its real date, so this plan can be re-verified for staleness before anyone drafts from it.
- **Interlink target** — which existing post (if any, from step 3) or sibling cluster this should link to/from once written. If none exists yet, say so rather than leaving it blank.

## 5a. Wiring the batch together — not optional

A pillar/cluster plan is worthless as an SEO structure if the 10 written articles never actually link to each other. Confirmed live (2026-08-05): three full batches (30 posts across `dev-tools`, `data-automation`, `ai-productivity`) shipped with zero `relatedSlugs` and zero `series`/`seriesOrder` set on any of them — every one of the site's own topic-cluster hub-and-spoke mechanisms (`src/pages/[category]/[slug].astro`'s "Series progress (N of M)" nav, which only renders when `series` matches across posts) sat unused, so those 30 pages had no structural link to the pillar they were supposedly clustered under. Don't repeat this:

- The moment a batch's clusters are approved, decide the shared `series` value **now** — the pillar's title (or a shortened version of it) — and the `seriesOrder` each cluster will get (its position in the plan, 1-10; continuing 11-20 for a second pillar in the same category, matching the numbering convention in step 7). Record it in the plan file so `write-article` doesn't have to reinvent it per cluster.
- Hand this off explicitly to whoever drafts each cluster (see `write-article`'s own checklist, which now requires it): every cluster in an approved batch gets `series` + `seriesOrder` in frontmatter, no exceptions, even though the 10 clusters aren't meant to be read in a strict linear order the way a migration-guide series is — the shared `series` value is what makes the site render the "part of this cluster, here are the other 9" navigation regardless of read order.
- **The pillar topic itself is currently never published as a real page** — it only exists in this plan file as the rationale for picking 10 clusters. That's a real gap: a proper topic-cluster structure has a hub page the 10 spokes link back to, not just each other. Before finalizing the plan, ask the user whether the pillar topic should also be drafted as its own standalone article (broad, comprehensive coverage of the pillar topic, linking out to all 10 clusters once written) — don't silently skip this decision the way every batch so far has.

## 6. Output format

Plain text, no article prose:

```
CORE PILLAR TOPIC: <title>  (Category: <slug>)
<1-2 sentences on why this is the pillar — volume + timeliness + structural breadth>

CLUSTER 1
- Search Intent / Signal: <verbatim string [confirmed] OR symptom [paraphrased]>
- Structural Problem: <mechanical explanation>
- Proposed H1: <≤60 chars>
- Source: <link/issue + date>
- Interlinks: <existing slug(s) or "none yet">

CLUSTER 2-10: same shape
```

## 7. Persist the plan to a tracking file

A plan that only exists in chat can't survive a session ending mid-batch. Write (or update) `.claude/content-plans/<category-slug>.md` — same fields as the step 6 output, plus **Status** (`pending` → `approved` → `written`) and **Slug** per pillar/cluster:

```
# Content Plan — <Category Name>

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar
**<title>**
- Status: pending
- Slug: -
- Why pillar: <1-2 sentence rationale>

## Clusters

### 1. <Proposed H1>
- Status: pending
- Slug: -
- Search Intent / Signal: <verbatim [confirmed] or symptom [paraphrased]>
- Structural Problem: <explanation>
- Source: <link + date>
- Interlinks: <existing slug(s) or "none yet">

### 2-10: same shape
```

- On a fresh research run, write every entry as `pending`.
- When the user approves specific clusters in chat, flip those to `approved` before writing starts — don't leave the file out of sync with what was actually greenlit.
- Leave `written`/`Slug` updates to `guides-fixes-article` (or the equivalent category skill) once the MDX file actually exists — this skill's job ends at a reviewed, persisted plan.
- If a file for this category already exists, update it in place rather than overwriting — a second research run should merge in new clusters, not erase progress on ones already `approved` or `written`.
- If that existing pillar is already **complete** (every cluster `written`), a new research run is a second, independent pillar for the same category, not more slots on the first — don't stretch to find an 11th cluster for an already-full pillar. Append a new `# Pillar 2` / `## Clusters (Pillar 2)` section below the first pillar's content, numbering clusters 11-20 (continuing the sequence, not restarting at 1, so slugs/status/interlinks stay unambiguous within one file), and leave the first pillar's own content untouched. Confirmed live (2026-08-05): guides-fixes needed exactly this after its first pillar (Sätteri/Markdown pipeline) finished — the second pillar (Vite 8/Rolldown, a genuinely distinct structural layer) used this same-file, numbered-continuation structure.

## 8. Adapting the engine per category

The concrete methodology above (structural breaking point sourced from GitHub issues/changelogs) is proven for `guides-fixes`. The other three categories bend the same shape without changing the process in sections 1-6:

- **dev-tools** — pillar is usually a tool/workflow friction point from a version bump, vendor change, or deprecated CLI flag, not necessarily a console error. Research sources widen here: alongside GitHub issues/changelogs, check Hacker News discussions and GitHub trending tool repos for emerging friction points — this category's audience surfaces problems there before they become formal issues. Every cluster must require opening a terminal, editing a config file, or running CLI parameters to resolve — reject a candidate that's explainable with no hands-on step, even if it's a real, timely topic; that's a `write-article`-general-category piece, not a dev-tools structural cluster. See [dev-tools-article](../dev-tools-article/SKILL.md) for the matching drafting blueprint.
- **data-automation** — pillar is usually a pipeline, API, or schema breaking change (a deprecated endpoint, a changed webhook payload, a queue/rate-limit behavior shift). Every cluster must require touching a pipeline config, an API call, a webhook payload/handler, or an automation script to resolve, the same hands-on discipline `dev-tools` applies to terminal/CLI work. See [data-automation-article](../data-automation-article/SKILL.md) for the matching drafting blueprint.
- **ai-productivity** — pillar is usually a model, agent-tooling, or prompting-pattern shift (a deprecated model ID, a changed tool-use schema, a capability regression). Every cluster must require touching a model API call, a tool/function-calling schema, or an agent/MCP config to resolve, the same hands-on discipline `dev-tools` and `data-automation` apply to their own surfaces. Model capability claims are the easiest thing on this site to fabricate convincingly; verify every model ID and parameter against a primary source (official docs, model card, changelog), never state a remembered or plausible-sounding capability as current fact. See [ai-productivity-article](../ai-productivity-article/SKILL.md) for the matching drafting blueprint.

If the user supplies a category-specific prompt (as they did for `guides-fixes`), treat its exact wording as authoritative for that category's flavor and fold it in here rather than relying on the generalization above.

## 9. Before handing the plan back, check every one of these

- [ ] Category is exactly one of the four `CATEGORY_SLUGS`.
- [ ] Pillar is structural and timely, not a generic/evergreen concept.
- [ ] Every cluster's verbatim/paraphrased status is labeled honestly — nothing invented.
- [ ] Every cluster's H1 is ≤60 characters.
- [ ] `src/content/blog` was actually checked for collisions, not assumed clear.
- [ ] Every cluster names a real source and date, not a vague "recent issue."
- [ ] Interlink targets are named where they exist, not left implicit.
- [ ] `.claude/content-plans/<category-slug>.md` was written or updated (merged, not overwritten) to match this output.
- [ ] A shared `series` value and per-cluster `seriesOrder` (1-10, or continuing the sequence for a later pillar) are decided and recorded in the plan, so every cluster in the batch actually gets linked together once written (see step 5a) — this is not optional.
- [ ] Whether the pillar topic itself should be drafted as a standalone hub article was raised with the user explicitly, not silently skipped (see step 5a).
- [ ] Output makes clear this is a plan for review, not a request to start drafting — drafting starts only after the user approves specific clusters, and then goes through `write-article` one cluster at a time.
