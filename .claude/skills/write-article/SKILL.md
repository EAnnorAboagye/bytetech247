---
name: write-article
description: Draft or revise a ByteTech247 blog post (MDX) so it reads as genuine human writing while earning search, generative-engine, and answer-engine visibility. Use this whenever asked to write, draft, expand, or edit a post in src/content/blog.
---

Every post on this site is written for a reader who has a specific problem, not for a crawler. Ranking is a side effect of actually answering the question well — never the other way around. If a section doesn't help the reader decide or do something, cut it; there is no minimum word count to hit.

## 1. Before writing a single sentence

- **Name the search intent in one line**: is the reader trying to learn a concept, fix a specific error, compare options, or follow steps? The whole structure below serves that intent — a comparison dressed up as a how-to loses both audiences.
- **Pick one primary keyword/phrase and 2-3 related terms** the topic naturally requires. Write them down before drafting. This is what prevents stuffing later — you already have a target, so there's no temptation to repeat it artificially.
- **Confirm the category** is exactly one of: `dev-tools`, `data-automation`, `ai-productivity`, `guides-fixes` (`src/config.ts`). If the post doesn't fit one cleanly, that's a sign the topic needs narrowing before it's a sign the taxonomy needs changing.
- **Have something to say that isn't already the top result.** A real recommendation, a gotcha you'd only know from running it, a specific number. If the draft would read identically to the three posts already ranking for this query, it isn't ready.

## 2. Structure, top to bottom

1. **Title** — the primary keyword near the front, phrased the way a person would actually search or ask, not a slogan. **60 characters or fewer, no exceptions** — past that, Google truncates it in search snippets, and `src/content.config.ts` enforces the same limit as a build error, so a draft that skips this check fails the build, not just the review. Count it before you move on; don't estimate.
2. **Meta description (frontmatter `description`)** — one or two sentences that would make someone click, written for the SERP snippet, not a summary written for the reader who already opened the post. **160 characters or fewer, no exceptions** — same truncation logic as the title, and `src/content.config.ts` enforces it as a build error. Must contain the primary keyword/phrase from step 1 — a description that only gestures at the topic, without the actual term, doesn't confirm the match a searcher is scanning for.
3. **Opening (1-2 short paragraphs)** — answer the core question directly in the first 40-80 words, then give the one sentence of context that earns the rest of the article. The primary keyword/phrase belongs somewhere in this opening, naturally — not forced into the first sentence if it reads awkwardly there, but present before the paragraph ends. This is the paragraph search engines lift into featured snippets and the one AI answer engines quote — treat it as load-bearing, not throat-clearing. See the opening of `src/content/blog/git-worktrees-parallel-feature-development/index.mdx` for the pattern: state the friction, then state the fix, no preamble.
4. **Body sections (`##`/`###`)** — one real sub-question per heading, in the order a reader would actually ask them. Each section makes exactly one point and backs it with a command, a number, or a concrete example — never "many developers find that...". Use the site's actual MDX components where they earn their place, not by default:
   - `<Callout type="tip|warning|note">` for a genuinely separable aside (a gotcha, a caveat) — not for restating the paragraph above it.
   - `<CodeTabs>` only when there are truly two comparable approaches worth seeing side by side.
   - `<Benchmark>` only when you have real numbers to show, not illustrative ones.
   - `<Figure>` with a required, descriptive `alt` — never decorative-only images.
   - Fenced code blocks with a `title="..."` comment when the filename matters to following along.
5. **Lists/tables** — only for content that is genuinely sequential (steps) or comparative (options/specs). If a bullet list could be one plain sentence, make it one plain sentence.
6. **Internal links (2-4)** — placed inline where the connection is real (a related post, that post's category index), not batched into a "see also" dump at the end.
7. **External citation (1-3)** — link to the primary source (official docs, the standard itself, the original benchmark), not a secondary blog restating the same primary source.
8. **FAQ block** — add only if there are genuinely distinct follow-up questions a reader would still have after the body. If you're inventing questions to fill a section, skip it entirely; a forced FAQ is stuffing with a different name. When one is genuinely warranted, put it in frontmatter as `faq: [{question, answer}]` (`src/content.config.ts`), not prose in the MDX body — `FaqSection.astro` renders it and `src/lib/json-ld.ts` emits matching `FAQPage` schema from that same array, so the visible section and the structured data can never drift apart. Never write the FAQ as body text only; the frontmatter array is the single source of truth for this.
9. **Closing paragraph** — a real judgment call or next step ("reach for X when Y; skip it if Z"), never a restatement of the opening. If you'd delete it and lose nothing, delete it.

## 3. Cover image sourcing (Pexels)

Every post needs `coverImage` + `coverImageAlt`. Prefer a real screenshot or diagram you (the author) made whenever the topic is a specific tool, command, or UI — a stock photo can't show a terminal output or a settings panel, and a generic photo on a command-specific post reads as filler. Fall back to Pexels only when the topic is conceptual enough that a real photo genuinely fits (roughly: `ai-productivity` and `data-automation` posts more often qualify than `dev-tools`/`guides-fixes` posts about a specific CLI or error).

When a Pexels photo is the right call:

1. Read `PEXELS_API_KEY` from `.dev.vars` (never hardcode it, never print it back in chat or commit it — see `docs/ENVIRONMENT.md`).
2. Search by the post's primary keyword/topic, not generic terms like "technology" or "computer" — specificity here matters the same way it does in the prose.
   ```bash
   curl -H "Authorization: $PEXELS_API_KEY" \
     "https://api.pexels.com/v1/search?query=<topic>&per_page=3&orientation=landscape"
   ```
3. Show the user 2-3 candidates — thumbnail URL, photographer name, and the photo's Pexels page URL — and wait for them to pick one. Never auto-select and download without that approval; downloading a file is an explicit-permission action regardless of how routine it feels.
4. Once approved, download the chosen photo's `src.large` (or `src.original`) straight into that post's content folder as `cover.jpg`/`cover.png`, matching every existing post's local-asset pattern (`coverImage: "./cover.jpg"`) — never a hotlinked remote URL in frontmatter.
5. Write `coverImageAlt` yourself, describing what's actually relevant to the post — don't copy Pexels' own photo title/description verbatim.
6. Pexels' license doesn't require in-post attribution, but a visible credit is a real trust/E-E-A-T signal and it's cheap to show — set `coverImageCredit: { name: "...", url: "..." }` in frontmatter (the photographer's name + their Pexels profile URL) whenever the cover is a Pexels photo. The template renders it under the cover image automatically; leave the field out entirely for an author's own screenshot/diagram. The same `credit` prop is available on `<Figure>` for any in-body Pexels image.

## 4. Sentence and paragraph rules

- **Grade-5 applies to sentence structure, not vocabulary.** Short sentences, active voice, one idea per sentence. Keep precise technical terms this audience needs (`worktree`, `HSTS`, `debounce`) — explain on first use instead of replacing them with a vaguer word. Simplifying the terms a developer actually needs to know reads as condescending, not clear.
- **Vary sentence length on purpose.** A run of same-length sentences is the most reliable statistical fingerprint of generated text. Mix a short, blunt sentence next to a longer one that carries a dependent clause.
- **Paragraphs stay short**: 2-4 sentences, one point each. If a paragraph is doing two jobs, split it.
- **Specificity over generalization, always.** Replace "this can significantly improve performance" with the actual number you measured, or cut the claim.
- **No repetition of the same point in different words** to pad length. Say it once, well, and move to the next point.
- **Do not force a keyword into a sentence where it doesn't fit naturally.** The related-terms list from step 1 should already cover the topic without repetition — if you're rereading a sentence and it feels inserted, it was.
- **Readability target: Flesch Reading Ease 90-100** ("very easy," roughly 5th-grade level) — the numeric version of this section's grade-5 rule above. Short sentences (~15-20 words average), common everyday words, active voice, one idea per sentence, while still keeping the precise technical terms the topic needs. If a score is wanted on a specific draft, say so and it can be computed from the actual sentence/word/syllable counts rather than eyeballed.
- **Human dashes only. No em dash (`—`) anywhere in article prose** — use a hyphen (`-`), a comma, or split into two sentences instead. This applies to every category, not just one: an em dash used as a default transition is one of the most reliable tells of generated text (see the banned-patterns list below). Exception: a real, verbatim quoted string (an error message, a log line, a flag's exact name) that itself contains an em dash — preserve it exactly, never rewrite a quote to satisfy a style rule.

## 5. Banned phrases and patterns

The goal stated plainly: every post should read as written by a person who did the thing, not generated by a model that described it. Cut these on sight — each is a well-known tell of generated, not authored, text:

- "In today's fast-paced/digital world"
- "Dive into" / "Let's dive in" / "Let's explore"
- "Unlock the power of"
- "Game-changer" / "revolutionize"
- "In conclusion" / "To sum up"
- "It's important to note that"
- "Whether you're a beginner or an expert"
- Overuse of "Furthermore" / "Moreover" as paragraph openers
- Any sentence that could apply to literally any tool in the category (if it isn't specific to _this_ one, cut it)

## 6. E-E-A-T signals (Google's quality framework, applied)

Google's ranking guidance evaluates Experience, Expertise, Authoritativeness, and Trustworthiness. This isn't a separate task bolted onto the steps above — it's naming what steps 1-5 already produce when followed honestly. Check it explicitly before publishing rather than assuming it happened as a side effect:

- **Experience** — at least one detail in the post could only come from actually doing the thing: a real command run, a real error reproduced, a real screenshot, a real number measured. Step 1's "have something to say that isn't already the top result" is this same requirement, stated a different way.
- **Expertise** — specific version numbers, exact API/flag/command names, and a correct mechanical explanation of why something happens, not "this usually happens because...". A vague claim reads as the absence of expertise, not its presence.
- **Authoritativeness** — the 1-3 external citations (step 2.7) link the primary source (official docs, the actual issue or changelog, the standard itself), not a secondary blog restating it. Citing a primary source is what signals authority; citing a summary of a summary erodes it.
- **Trustworthiness** — every factual claim is verified, not guessed. If a claim can't be verified, either verify it before publishing or state the uncertainty honestly ("unconfirmed whether this affects v6" beats a confident-sounding guess). A wrong claim stated confidently damages trust more than an honest "not verified yet."

## 7. Before calling a draft done, check every one of these

- [ ] Title is 60 characters or fewer (count it — `src/content.config.ts` fails the build otherwise) and carries the primary keyword near the front.
- [ ] The meta `description` is 160 characters or fewer (count it) and contains the primary keyword/phrase.
- [ ] The first 80 words answer the actual question, contain the primary keyword/phrase, and have no throat-clearing before them.
- [ ] Every `##` heading is a real sub-question, in the order a reader would ask.
- [ ] Every paragraph makes one point and could be summarized in a single clause.
- [ ] At least one detail in the post could only come from having actually done the thing (a command, a number, a specific failure).
- [ ] Nothing repeats a point already made elsewhere in different words.
- [ ] No banned phrase from section 5 survived.
- [ ] Sentence lengths visibly vary when you read it aloud, consistent with a 90-100 Flesch Reading Ease target.
- [ ] Zero em dashes in the prose (a real verbatim quoted string is the only exception).
- [ ] E-E-A-T checked explicitly: an Experience-only-detail is present, Expertise-level specifics (versions, exact names) are used, citations are primary-source (Authoritativeness), and every factual claim is verified rather than guessed (Trustworthiness).
- [ ] The closing paragraph gives a real recommendation, not a summary.
- [ ] The cover image is a real screenshot/diagram, or a genuinely fitting Pexels photo the user approved from candidates — never an auto-picked stock photo.
- [ ] `tags`, `relatedSlugs` (if any genuinely relevant posts exist), and `coverImageAlt` are filled in — frontmatter must match the schema in `src/content.config.ts` exactly: `title`, `description`, `date`, `category` (one of the four slugs), `tags`, `relatedSlugs`, optional `series`+`seriesOrder` together or not at all, `coverImage`, `coverImageAlt`, optional `coverImageCredit` (Pexels only), optional `faq` (only if genuinely warranted).
- [ ] No `# ` (H1) heading anywhere in the body — the page title is the only H1, enforced by a build-time check (`src/lib/validate-no-h1-in-body.ts`); every body section starts at `##` or deeper.
- [ ] Read it once as only a reader, not a writer: does it actually solve the problem, start to finish? If any section doesn't, it doesn't survive.
