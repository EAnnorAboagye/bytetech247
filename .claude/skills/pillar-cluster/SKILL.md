---
name: pillar-cluster
description: Research and draft a Topic Cluster (1 Core Pillar + 5 Sub-Topic Clusters) for a ByteTech247 content category, grounded in live GitHub issues, changelogs, and search trends. Use whenever asked to plan a content cluster, topic map, or pillar/cluster strategy for dev-tools, data-automation, ai-productivity, or guides-fixes — this produces the plan only, not the articles (hand approved clusters to the write-article skill one at a time).
---

This is the planning stage that runs *before* `write-article`. It answers "what should we write and why will it rank" — never the drafting itself. Output is a Pillar + 5 Clusters map the user reviews and approves before any article gets written.

## 1. Resolve inputs before researching

- **Category** (required) — must be exactly one of the four slugs in `src/config.ts`: `dev-tools`, `data-automation`, `ai-productivity`, `guides-fixes`. If the user names a topic instead of a slug, map it yourself and say which slug you picked. A pillar/cluster plan that doesn't map cleanly to one of these four will fail `content.config.ts`'s `category: z.enum(CATEGORY_SLUGS)` build check the moment anyone drafts it — catch that here, not at build time.
- **Target ecosystem** — default to the site's *own* stack, read live from `package.json` and `wrangler.jsonc`/deploy config, not a guessed or generic stack. Dogfooding gives first-person authority ("we hit this in our own build") that a generic pick can't, and it's why `guides-fixes` pillars should almost always trace back to Astro, Tailwind, TypeScript, or the Cloudflare Workers deploy path this repo actually runs. For categories where the site's own dependencies don't cover the ground (e.g. a `dev-tools` piece on a CLI ByteTech247 doesn't itself run), the user's stated target stands, but say so explicitly rather than silently substituting a generic pick.
- **Window** — "active right now" means sourced from the last ~90 days of *real* calendar time (GitHub issues, release notes, changelogs, StackOverflow trends), not the sandbox's system date. Check the actual publish/commit date on anything you cite.

## 2. Live research (do not skip — this is the whole point)

Use real web search against GitHub issue trackers, official changelogs, and release notes for the target ecosystem. For each candidate breaking point, capture:

- The exact source (issue number, changelog entry, discussion thread) and its real date.
- Whether the reported symptom includes a **literal, copy-pasteable string** (an error message, a console warning) — this is a confirmed-verbatim signal. If you only have a described symptom ("spacing disappears after upgrading") with no literal string in the source, that's a paraphrased signal, not verbatim — label it as such in the output. Never invent a fake "verbatim" error string; half the AEO value is matching the exact text a developer pastes into a search bar, and a fabricated one matches nothing.

## 3. Existing-content collision check

Before finalizing anything, check `src/content/blog/*/index.mdx` frontmatter (`category`, `tags`, `title`) for topics that already cover the ground a candidate cluster would cover. If a real overlap exists:

- Prefer folding the new angle into the existing post (flag this to the user as "extend X" rather than "new cluster").
- If the cluster is genuinely a distinct angle on the same underlying topic (e.g. a follow-up runtime error vs. the original setup post), keep it as its own cluster but name the existing post it should link to/from — this becomes the interlink field in step 5.

Never let a generated pillar/cluster plan silently duplicate a slug that already exists.

## 4. Select the pillar

One core, structural, high-volume breaking point — never a generic "how to learn X" or "introduction to Y" concept. It should be the kind of thing that:

- Affects most people on the current major/minor version of the target ecosystem, not an edge case.
- Is timely (inside the research window from step 1), so the cluster reads as "active right now," not evergreen filler.
- Is broad enough structurally to genuinely support 5 distinct, non-overlapping sub-errors underneath it — if you're stretching to find a fifth cluster, the pillar is too narrow.

## 5. Generate exactly 5 clusters

Each cluster needs all of these fields — this is stricter than the original prompt template specifically to close gaps found running it:

- **Search Intent / Signal** — the verbatim error string (marked confirmed) or the described symptom (marked paraphrased), per step 2.
- **Structural Technical Problem Explained** — why this happens mechanically, not just what the symptom looks like. A reader should understand the root cause, not just recognize the error.
- **Proposed H1** — phrased the way someone would actually search, **60 characters or fewer** (matches `content.config.ts`'s title cap enforced in `write-article`, so the eventual draft never needs retitling).
- **Source + date** — the issue/changelog/thread and its real date, so this plan can be re-verified for staleness before anyone drafts from it.
- **Interlink target** — which existing post (if any, from step 3) or sibling cluster this should link to/from once written. If none exists yet, say so rather than leaving it blank.

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

CLUSTER 2-5: same shape
```

## 7. Adapting the engine per category

The concrete methodology above (structural breaking point sourced from GitHub issues/changelogs) is proven for `guides-fixes`. The other three categories bend the same shape without changing the process in sections 1-6:

- **dev-tools** — pillar is usually a tool/workflow friction point from a version bump, vendor change, or deprecated CLI flag, not necessarily a console error.
- **data-automation** — pillar is usually a pipeline, API, or schema breaking change (a deprecated endpoint, a changed webhook payload, a queue/rate-limit behavior shift).
- **ai-productivity** — pillar is usually a model, agent-tooling, or prompting-pattern shift (a deprecated model ID, a changed tool-use schema, a capability regression).

If the user supplies a category-specific prompt (as they did for `guides-fixes`), treat its exact wording as authoritative for that category's flavor and fold it in here rather than relying on the generalization above.

## 8. Before handing the plan back, check every one of these

- [ ] Category is exactly one of the four `CATEGORY_SLUGS`.
- [ ] Pillar is structural and timely, not a generic/evergreen concept.
- [ ] Every cluster's verbatim/paraphrased status is labeled honestly — nothing invented.
- [ ] Every cluster's H1 is ≤60 characters.
- [ ] `src/content/blog` was actually checked for collisions, not assumed clear.
- [ ] Every cluster names a real source and date, not a vague "recent issue."
- [ ] Interlink targets are named where they exist, not left implicit.
- [ ] Output makes clear this is a plan for review, not a request to start drafting — drafting starts only after the user approves specific clusters, and then goes through `write-article` one cluster at a time.
