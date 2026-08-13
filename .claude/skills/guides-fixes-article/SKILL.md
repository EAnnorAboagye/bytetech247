---
name: guides-fixes-article
description: Apply the Guides & Fixes SEO/AEO/GEO blueprint (keyword targeting, Quick Answer block, verbatim error sourcing, citations, internal linking, FAQ, Before/After code windows, 90-100 Flesch readability, human dashes only) when drafting a post in the guides-fixes category. Use together with write-article — write-article covers general structure/tone/checklist, this skill layers the category-specific transactional-bug-fix format on top. Only applies when the post's category is guides-fixes.
---

This is an addendum to `write-article`, not a replacement — run both. `write-article` covers title/description caps, banned phrases, cover image sourcing, and the general checklist. This skill covers what's specific to `guides-fixes`: a reader who pasted an exact error into a search bar and needs the fix fast, not a concept explainer.

## 1. Scope check

Only apply this blueprint when `category: guides-fixes` in the post's frontmatter. If the post originated from an approved [pillar-cluster](../pillar-cluster/SKILL.md) entry, pull its **Source + date**, **verbatim/paraphrased label**, and **Interlink target** straight from that plan — don't re-research from scratch if it's already sourced.

If `.claude/content-plans/guides-fixes.md` exists, find this topic's entry there and confirm its **Status** is `approved` (not still `pending`) before drafting. Once the MDX file is created, flip that entry's Status to `written` and fill in its Slug — this is what lets the batch loop ("write every approved cluster") resume correctly if the session ends mid-batch.

## 2. Before drafting: keyword targeting

Same discipline as `write-article` step 1, made concrete for an error-fix post:

- **Primary keyword/phrase** is the verbatim error string itself (or its distinctive fragment) — this is what makes guides-fixes different from other categories, the keyword _is_ the search query almost verbatim.
- **2-3 related terms**: the framework/library name + version, the API or method that throws, and the underlying cause in plain words (e.g. "undefined array", "missing env variable"). Write these down before drafting so the body naturally covers search variants of the same intent without repeating the exact string on every line.

## 3. Title

Same 60-character cap as every post (`src/content.config.ts`), but a full console error rarely fits alongside "How to Fix" and the framework name. When the verbatim string is long:

- Shorten to the distinctive fragment in the title (`Fix "Cannot read properties of undefined (map)" in Astro`), not a paraphrase.
- Put the **complete, exact** string in the Quick Answer block instead, where there's no length cap.
- Never trim a real error string in a way that changes what someone would actually search — cut trailing detail, never cut from the middle.

## 4. Meta description

`content.config.ts` caps `description` at 160 chars, build-enforced, same as every post — but for guides-fixes it does a second job: it's often the first place the abbreviated error appears in the SERP snippet, before the reader even clicks through.

- ≤160 chars, contains the primary keyword (the error fragment from step 2).
- Written to earn the click: state the fix exists and works, not just that the post "covers" the error (`"Fix the Astro map() undefined crash with one guard clause — tested on v7.1."` beats `"A guide to a common Astro error."`).

## 5. Quick Answer block (the AEO/GEO anchor)

This is the concrete guides-fixes version of `write-article`'s opening-paragraph rule (step 2.3 there: answer in the first 40-80 words) — same job, with a required label and a stricter length target for snippet extraction.

- Heading it `## Quick Answer` (or similar direct label), immediately after the title/intro line — no throat-clearing before it.
- **40-60 words.** Snippet boxes and AI-overview extracts truncate mid-sentence past that; write to end cleanly inside the limit, don't just happen to be short.
- Must contain the **exact, verbatim error string**, sourced from a real reproduction — not a plausible-sounding guess. If you can't verify the string, don't publish the post yet; a fabricated "verbatim" string matches nothing anyone actually pastes into search.
- State the fix in the same block as a concrete one-liner (a real code fragment, not "add error handling") — the reader should be able to act on this paragraph alone even if they read nothing else.

## 6. Diagnosis section (the "why it happens" body)

`write-article`'s body-section rule ("one real sub-question per heading, in the order a reader would actually ask") applies here specifically as:

- First `##`: why the error happens mechanically (the root cause, not a restatement of the symptom).
- Following `##`s only if there's a genuinely distinct sub-question: does it happen in other versions, is it a config issue vs. a code issue, is there a variant of the same error. If there's only one real question, one heading is correct — don't manufacture headings to look thorough.
- Every claim here needs a specific detail: a real line from a stack trace, a version number, a linked source — never "in many cases" or "this can happen for various reasons."

## 7. Technical details (visible content, not a second schema block)

The blueprint's "Target Framework / Rendering Mode / Error Classification" metadata is genuinely useful — keep it, but as a short visible list or `##` section the reader (and AI crawlers reading rendered content) can see, **not** as a hand-authored `TechArticle` JSON-LD block. `src/lib/json-ld.ts` deliberately locks every post to `BlogPosting`/`NewsArticle` via `articleSchemaType()` (see its comment on `TIME_SENSITIVE_CATEGORIES`) — a second, hand-written Article-type schema block in the MDX body would duplicate or conflict with the site-wide one Google actually reads. State framework/version info in prose instead.

**Verify the version range, don't guess it.** "Astro v4.0+ / v5.0" with no source is a placeholder, not a fact. State the exact range where you've confirmed the bug reproduces, cite the issue/changelog it came from, and note if it's since been patched — same discipline as pillar-cluster's Source+date field.

## 8. Before/After code windows

- Same file, same component — a realistic context, not contrived toy code.
- **Minimal diff.** If the fix requires more than one real change (as in a `.catch()` + a guard + a fallback), label each one with its own short comment so the reader can tell which line actually fixes the crash versus which lines are just good hygiene riding along.
- Prefer plain-text markers over emoji in code comments (`// BROKEN — crashes when...` / `// FIXED — guards against...`) — screen readers and terminal output don't always render ❌/✅ cleanly, and it keeps the comment legible as plain text if someone copies just the code block.

## 9. Citations and internal links

Both required by `write-article` (external citation 1-3, internal links 2-4) and both real trust/GEO signals for a fix post — generative engines weight pages that cite verifiable sources higher when deciding what to quote, and internal links are how a single fix post reinforces the pillar it belongs to.

- **External (1-3):** link the primary source inline where the diagnosis is stated — the actual GitHub issue, official changelog entry, or docs page the fix comes from. Not a secondary blog that's also just restating the same issue.
- **Internal (2-4):** placed inline where the connection is real, not batched at the end. This site also means linking back to the site's own structure, not just sibling posts:
  - The [pillar-cluster](../pillar-cluster/SKILL.md) entry's **Interlink target**, if this post came from an approved cluster.
  - The post's own category index (`/guides-fixes`) and any genuinely relevant tag page — reinforces the hub-and-spoke structure the whole pillar/cluster system depends on, not just post-to-post links.
  - Any other post on this exact framework/error family already published (checked the same way `pillar-cluster` step 3 checks for collisions).

## 10. FAQ block

Bug-fix posts are the category most likely to have genuinely distinct follow-ups — check before skipping this, don't default to skipping it. Typical real questions for this category: does this affect other versions, is there a workaround if the primary fix doesn't apply, is this a bug or a config mistake. Same rule as `write-article` step 2.8: only include questions a reader would actually still have, in frontmatter `faq: [{question, answer}]`, never invented to fill space, never body-only prose — `FaqSection.astro` and `json-ld.ts`'s `FAQPage` output both depend on that array being the single source of truth.

## 11. Cover image

`write-article`'s own cover-image guidance already says guides-fixes is the category _least_ likely to genuinely qualify for a Pexels stock photo. For this category specifically: default to a real screenshot of the actual error (terminal output, browser console, or the before/after diff itself) — a generic stock photo on a post about one specific error reads as filler and gives a reader nothing to visually confirm they've found the right fix. Follow `write-article`'s Pexels workflow (search, present candidates, wait for approval) only if the topic is genuinely conceptual enough that no real screenshot applies.

**Never use AI image generation to depict a screenshot, terminal, or UI for this category.** An AI-generated "screenshot" of a terminal or UI can look plausible while showing fabricated error text, version numbers, or code — actively misleading for a category whose whole premise is a verified, reproduced error. A reader who spots a fake-looking screenshot loses trust in the post's claims too, which is a worse outcome than a plain stock photo would ever cause. This is near-total in practice for guides-fixes specifically, since real screenshots almost always apply here; on the rare post genuinely conceptual enough that no screenshot applies at all (see `write-article` §3), its abstract-illustration option is available, same constraints as there — never a substitute for a real captured error.

**Generate the cover deterministically from real captured data instead**, with `scripts/make-terminal-cover.mjs` (committed, reusable — not a one-off scratch script):

```bash
node scripts/make-terminal-cover.mjs <post-folder>/cover.png <config.json>
```

`config.json` is `{ titlebarLabel, lines: [{ text, tone }] }`, where `tone` is `prompt | error | dim | plain | accent`. `text` must be the actual captured output from reproducing the bug (or a deliberately trimmed excerpt, noted as such in the post body per step 8's Before/After rule) — never invented text, same discipline as every other claim in this skill. Delete the config file after generating; only the resulting PNG is committed.

This fits when the error is genuinely console/terminal output. When the bug is a rendering/visual difference instead (like a spacing regression), hand-build an SVG with the same brand palette (below) showing the real before/after states — there's no single template for that shape since the comparison varies per bug, but the colors and general layout conventions (dark window chrome, monospace text, rounded panel) should still match so covers read as one system across posts.

**Brand palette** (same values as `scripts/make-default-og-image.mjs` — keep them in sync): `INK #0B120F` (background), `SIGNAL #14957F` (accent/prompt), `TRACE #6B7D77` (dim/secondary text), `PAPER #F4F2ED` (primary text), `ERROR_RED #E5484D` (error text). 1600x900, rendered via `@resvg/resvg-js` (not `sharp` — see that script's own comment for why).

**Check for a visual collision before finalizing.** Open the actual cover image of any sibling/interlinked post (not just its `coverImageAlt` text) and compare. Two posts with a similar-sounding symptom can end up with near-identical covers if you reuse the same example content and layout — this happened once already: the compressHTML cluster's first draft used the same "5posts"/"5 posts" framing as the pre-existing `astro-whitespace-collapse-expression-bug` post it interlinks with, and had to be redesigned around different example content before commit. If a real collision risk exists, change the example content and/or the framing (not just the colors) so the two don't read as duplicate thumbnails in the archive.

## 12. House style (this project's additions)

- Inherits `write-article`'s base rules on readability (Flesch Reading Ease 90-100) and dashes (hyphens only, no em dash — see that skill's section 4) — nothing category-specific to add on top of those.
- **Tone: direct imperative, not hedged suggestion.** A reader here has a broken build, not idle curiosity. Write "Add the array guard before the `.map()` call," not "You might consider adding a guard clause." Save nuance and trade-offs for the closing paragraph (`write-article` step 2.9), not the fix itself.

## 13. Before calling a guides-fixes draft done

Run `write-article`'s full checklist first, then check these on top:

- [ ] Primary keyword (the error fragment) and 2-3 related terms were named before drafting.
- [ ] Title ≤60 chars; if the error string was too long to fit, the full exact string appears in the Quick Answer block instead.
- [ ] Meta description ≤160 chars, contains the error fragment, and is written to earn the click.
- [ ] Quick Answer block is 40-60 words, contains the verbatim error string, and states a concrete one-line fix.
- [ ] The error string was actually reproduced/sourced, not invented — cite where it came from.
- [ ] Diagnosis section headings are real sub-questions, not manufactured ones.
- [ ] Framework/version claims are sourced and dated, not a guessed range.
- [ ] No `TechArticle` (or any other) hand-authored JSON-LD block in the MDX body — schema stays with the site-wide `BlogPosting` builder.
- [ ] Before/After code is a minimal, labeled diff from a realistic file, not a full rewrite.
- [ ] 1-3 external citations link the actual primary source inline.
- [ ] 2-4 internal links include the category/tag index and any pillar-cluster interlink target, not just sibling posts.
- [ ] FAQ was genuinely considered, not defaulted to skipped — added only if real distinct questions exist.
- [ ] Cover image is generated from real captured data (via `scripts/make-terminal-cover.mjs` or a hand-built SVG using the documented palette), or an approved Pexels photo only if the topic is genuinely conceptual — or, only if Pexels had no genuine fit, a generated abstract illustration checked for garbled pseudo-text. Never a generated image standing in for a real screenshot, never text/data invented for the image.
- [ ] Cover image was compared against sibling/interlinked posts' actual images, not just their alt text, to rule out a near-duplicate layout.
- [ ] `.claude/content-plans/guides-fixes.md` (if it exists) has this entry flipped to `written` with the real slug filled in.
- [ ] Tone reads as direct imperative, not hedged suggestion.
