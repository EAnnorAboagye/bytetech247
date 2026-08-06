---
name: dev-tools-article
description: Apply the Dev Tools SEO/AEO/GEO blueprint (tool/workflow keyword targeting, Quick Answer recommendation block, Structural Comparison Matrix, terminal/CLI-required scope, verbatim config/flag sourcing, citations, internal linking, FAQ, 90-100 Flesch readability, human dashes only) when drafting a post in the dev-tools category. Use together with write-article — write-article covers general structure/tone/checklist, this skill layers the category-specific tool-comparison/configuration format on top. Only applies when the post's category is dev-tools.
---

This is an addendum to `write-article`, not a replacement — run both. `write-article` covers title/description caps, banned phrases, cover image sourcing, and the general checklist. This skill covers what's specific to `dev-tools`: a reader mid-terminal-session deciding between two tools or workflows, or trying to get one configured correctly, not chasing a pasted error string the way `guides-fixes` readers are.

## 1. Scope check

Only apply this blueprint when `category: dev-tools` in the post's frontmatter. If the post originated from an approved [pillar-cluster](../pillar-cluster/SKILL.md) entry, pull its **Source + date**, **verbatim/paraphrased label**, and **Interlink target** straight from that plan — don't re-research from scratch if it's already sourced.

If `.claude/content-plans/dev-tools.md` exists, find this topic's entry there and confirm its **Status** is `approved` (not still `pending`) before drafting. Once the MDX file is created, flip that entry's Status to `written` and fill in its Slug.

**Hands-on constraint, checked before drafting starts:** every dev-tools post must require the reader to open a terminal, edit a configuration file, or run CLI parameters to get the payoff. If a topic is explainable with no hands-on step, it isn't a dev-tools structural cluster, even if it's a real and timely subject — that's a sign the topic belongs in a different category or needs narrowing, not a sign this rule should bend.

## 2. Before drafting: keyword targeting

Same discipline as `write-article` step 1, made concrete for a tool/workflow post:

- **Primary keyword/phrase** is usually a comparison ("X vs Y"), a configuration action ("configure X flag in Y"), or a named workflow ("orchestrating multiple feature branches with worktrees") — not a verbatim error string the way `guides-fixes` uses one. The keyword is what someone searches while choosing between tools or approaches, not while debugging a crash.
- **2-3 related terms**: the tool/CLI names + versions involved, the specific flag/subcommand/config key at the center of the post, and the underlying workflow it solves (e.g. "parallel branches," "context switching," "build cache reuse"). Write these down before drafting.

## 3. Title

Same 60-character cap as every post (`src/content.config.ts`), build-enforced. Comparison titles run long fast — watch this specifically, since a natural "X vs Y: doing Z cleanly" phrasing blows past 60 chars easily.

Concrete case to avoid: `"Git Worktrees vs Stash: Orchestrating Multiple Feature Branches Cleanly"` is 71 characters — over the cap, would fail the build. A compliant version that keeps the same intent: `"Git Worktrees vs Stash: Managing Parallel Branches"` (52 chars). Count the title before moving on; don't estimate.

## 4. Meta description

`content.config.ts` caps `description` at 160 chars, build-enforced. For dev-tools it does the job of stating the actual recommendation, not just the topic — a searcher comparing two tools decides whether to click based on whether the snippet already signals a clear answer exists (`"Use worktrees for parallel branches, stash for quick one-off changes — here's when each one actually wins."` beats `"A comparison of git worktrees and git stash."`).

## 5. Quick Answer block (the AEO/GEO anchor)

This is the dev-tools version of `write-article`'s opening-paragraph rule (step 2.3: answer in the first 40-80 words) — same job, with a required label and a stricter length target for snippet extraction.

- Heading it `## Quick Answer`, immediately after the title/intro line — no throat-clearing before it.
- **40-60 words.** Write to end cleanly inside the limit.
- State a clear, actionable recommendation in "use X when..., use Y when..." form — a reader should be able to make the decision from this paragraph alone. Vague hedging ("it depends on your workflow") fails this the same way an unverified error string fails `guides-fixes`' Quick Answer.
- Ground the recommendation in a real mechanical difference (what each tool actually does under the hood), not a marketing-style claim.

## 6. Structural Comparison Matrix (the Before/After analog)

This is dev-tools' equivalent of `guides-fixes-article`'s Before/After code window — the concrete artifact that earns the post's place. A markdown table comparing the two tools/approaches across genuinely distinct operational dimensions (not restatements of the same point in different words):

```markdown
## Structural Comparison Matrix

| Operational Metric | Approach A | Approach B |
| :----------------- | :--------- | :--------- |
| **Dimension 1**    | ...        | ...        |
| **Dimension 2**    | ...        | ...        |
```

**Every cell must be true, not illustrative.** Two failure modes to check for specifically:

- **Fabricated precision.** A cell like "0 seconds (instant)" or "15-30 seconds" with no source is invented benchmark data — the same anti-fabrication violation as inventing a "verbatim" error string in `guides-fixes`. If you haven't actually measured it, describe the mechanism qualitatively instead ("near-instant, no directory switch required" vs. "requires a stash/pop cycle each time") rather than assigning it a fake number.
- **False precision presented as fact.** If you did measure something, say how (what machine, what repo size, what command) or don't present it as a number at all.

3-5 rows is usually enough; padding to look thorough is the same problem `write-article` step 5 already flags for lists.

## 7. Configuration / CLI walkthrough

The hands-on payoff the scope check in step 1 requires. Same discipline as `guides-fixes-article`'s Before/After code windows, adapted:

- Real, runnable commands or a real config file snippet — not pseudocode.
- **Verify every command is complete and correct**, including flags that change behavior. A command like `git worktree add ../bugfix-login-endpoint hotfix-auth-patch` only works if `hotfix-auth-patch` already exists as a branch — if the walkthrough means "create a new branch," it needs `-b`: `git worktree add -b hotfix-auth-patch ../bugfix-login-endpoint`. A dropped flag that silently changes what the command does is worse than no example at all, since a reader will copy-paste it as-is.
- Label multi-step sequences with numbered comments explaining what each step accomplishes, the same way `guides-fixes-article` requires labeling each line of a multi-part fix.

## 8. Citations and internal links

Both required by `write-article` (external citation 1-3, internal links 2-4).

- **External (1-3):** the tool's own official docs, GitHub repo, or changelog — not a secondary blog restating the same reference. `git-scm.com`, a project's `CHANGELOG.md`, or its GitHub releases page are the right class of source here.
- **Internal (2-4):** the post's own category index (`/dev-tools`) and any genuinely relevant tag page, plus the [pillar-cluster](../pillar-cluster/SKILL.md) entry's **Interlink target** if this post came from an approved cluster. Check `src/content/blog/*/index.mdx` for real collisions before finalizing a topic, same as `pillar-cluster` step 3 — the published `dev-tools/git-worktrees-parallel-feature-development/` post is the concrete example: any new cluster that would cover the same ground needs a genuinely distinct angle and a link back to that existing post, not a duplicate.

## 9. FAQ block

Same rule as `write-article` step 2.8: only include questions a reader would genuinely still have after the body, in frontmatter `faq: [{question, answer}]`, never invented to fill space. Typical real questions for this category: does this apply across OSes/shells, is there a hybrid approach that uses both tools, does a specific version change any of this.

## 10. Cover image

Follow `guides-fixes-article`'s anti-fabrication discipline: **do not use AI image generation for this category** — a fabricated-looking terminal capture or config screenshot undermines trust in a post whose whole premise is a verified comparison.

- When the post centers on a single tool's CLI output (a config walkthrough, a single command sequence): generate deterministically from real captured data with `scripts/make-terminal-cover.mjs`, same as `guides-fixes-article` step 11 — `text` must be real, verified output, never invented.
- When the post centers on the Structural Comparison Matrix itself (a genuine tool-vs-tool piece with no single dominant terminal flow): hand-build an SVG using the same brand palette (`INK #0B120F`, `SIGNAL #14957F`, `TRACE #6B7D77`, `PAPER #F4F2ED`, `ERROR_RED #E5484D`, 1600x900, rendered via `@resvg/resvg-js`) showing the real comparison categories from the post's own table, not invented ones. Don't build a dedicated comparison-table cover script until a second dev-tools post actually needs this shape — one post doesn't justify a new committed script yet.
- Check the actual cover image (not just alt text) of any sibling/interlinked post before finalizing, to rule out a near-duplicate layout — same discipline as `guides-fixes-article` step 11.

## 11. Signal fields (Source + date, verbatim/paraphrased)

Kept from `pillar-cluster`'s general methodology, adapted for this category:

- **Verbatim/confirmed** = an exact, quotable string exists in the source — a specific CLI flag name, an exact deprecation notice, an exact error a misconfiguration throws.
- **Paraphrased** = a described friction point or workflow problem with no single literal string to quote (e.g. "context switching between branches loses uncommitted build artifacts").
- Every factual claim about how a tool behaves needs a real source and date, verified the same way the Vite 8 pillar's dev-toolbar claim had to be corrected this session after an unverified assumption turned out false — check the actual current behavior (source code, current docs, a recent issue) rather than stating what "used to be true" or "should be true" as current fact.

## 12. House style (inherited from guides-fixes-article)

- **Human dashes only.** No em dash (`—`) anywhere in article prose — use a hyphen, a comma, or split into two sentences. Exception: a real, verbatim quoted string (a flag name, an error) that itself contains one — preserve it exactly.
- **Readability target: Flesch Reading Ease 90-100.** Short sentences (~15-20 words average), common words, active voice, one idea per sentence — while keeping the precise technical terms readers need (`worktree`, `flag`, the exact command name).
- **Tone: direct imperative, not hedged suggestion.** Write "Use worktrees when you need two branches checked out at once," not "You might want to consider worktrees in some cases."

## 13. Before calling a dev-tools draft done

Run `write-article`'s full checklist first, then check these on top:

- [ ] Primary keyword (comparison/configuration/workflow phrase) and 2-3 related terms were named before drafting.
- [ ] The topic genuinely requires a terminal, config file, or CLI parameters — not explainable with zero hands-on step.
- [ ] Title ≤60 chars — counted, not estimated.
- [ ] Meta description ≤160 chars, states the actual recommendation, not just the topic.
- [ ] Quick Answer block is 40-60 words and gives a concrete "use X when / use Y when" recommendation, not a hedge.
- [ ] Structural Comparison Matrix has 3-5 genuinely distinct rows, and every cell is either a real sourced fact or an honest qualitative comparison — no invented precision numbers.
- [ ] Every command in the walkthrough is complete and correct, including flags that change behavior (verified, not assumed).
- [ ] 1-3 external citations link the tool's actual official docs/repo/changelog.
- [ ] 2-4 internal links include the `/dev-tools` category index and any pillar-cluster interlink target.
- [ ] `src/content/blog` was checked for real topic collisions before finalizing — not assumed clear.
- [ ] FAQ was genuinely considered, added only if real distinct questions exist.
- [ ] Cover image is generated from real captured data (terminal script) or a hand-built SVG using the documented palette and the post's real comparison data — never AI-generated, never invented text/numbers.
- [ ] Cover image was compared against sibling/interlinked posts' actual images to rule out a near-duplicate layout.
- [ ] `.claude/content-plans/dev-tools.md` (if it exists) has this entry flipped to `written` with the real slug filled in.
- [ ] Zero em dashes in the prose (verbatim quoted strings are the only exception).
- [ ] Tone reads as direct imperative, not hedged suggestion.
- [ ] Read the draft's sentences aloud: short, plain, one idea each — consistent with a 90-100 Flesch Reading Ease target.
