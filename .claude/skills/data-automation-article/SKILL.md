---
name: data-automation-article
description: Apply the Data Automation SEO/AEO/GEO blueprint (pipeline/API/webhook keyword targeting, Quick Answer block, Structural Comparison Matrix, hands-on pipeline/API/automation-script scope requirement, verbatim payload/error sourcing, citations, internal linking, FAQ, natural non-generated sentence rhythm, human dashes only) when drafting a post in the data-automation category. Use together with write-article — write-article covers general structure/tone/checklist, this skill layers the category-specific pipeline/API/automation format on top. Only applies when the post's category is data-automation.
---

This is an addendum to `write-article`, not a replacement — run both. `write-article` covers title/description caps, banned phrases, cover image sourcing, and the general checklist (which now also carries the site-wide sentence-discipline/dash/E-E-A-T rules this category inherits). This skill covers what's specific to `data-automation`: a reader building or maintaining a pipeline, API integration, webhook handler, or scheduled automation job, who needs to know what changed and exactly what to update, not a concept explainer.

## 1. Scope check

Only apply this blueprint when `category: data-automation` in the post's frontmatter. If the post originated from an approved [pillar-cluster](../pillar-cluster/SKILL.md) entry, pull its **Source + date**, **verbatim/paraphrased label**, and **Interlink target** straight from that plan — don't re-research from scratch if it's already sourced.

If `.claude/content-plans/data-automation.md` exists, find this topic's entry there and confirm its **Status** is `approved` (not still `pending`) before drafting. Once the MDX file is created, flip that entry's Status to `written` and fill in its Slug.

**Hands-on constraint, checked before drafting starts:** every data-automation post must require touching a pipeline config, an API call, a webhook payload/handler, or an automation script, the data-automation equivalent of [dev-tools-article](../dev-tools-article/SKILL.md)'s terminal/config requirement. If a topic is explainable with no pipeline, API, or automation artifact involved, it isn't a data-automation structural cluster, even if it's real and timely.

## 2. Before drafting: keyword targeting

Same discipline as `write-article` step 1, made concrete for a pipeline/API/automation post:

- **Primary keyword/phrase** is usually a breaking change ("X webhook payload changed," "Y endpoint deprecated"), a rate-limit or quota shift, or a pipeline/automation comparison ("X vs Y for scheduled deploys"), not a verbatim console error the way `guides-fixes` uses one.
- **2-3 related terms**: the service/API/platform name + version or API version, the specific endpoint/webhook event/queue at the center of the post, and the underlying automation it affects (e.g. "CI deploy pipeline," "webhook ingestion," "scheduled job"). Write these down before drafting.

## 3. Title

Same 60-character cap as every post (`src/content.config.ts`), build-enforced. API/webhook names run long fast (`X-Webhook-Signature-Version` style terms) — count before finalizing, don't estimate.

## 4. Meta description

`content.config.ts` caps `description` at 160 chars, build-enforced. For data-automation it should state the actual change and the action, not just the topic (`"Stripe's webhook payload adds a required apiVersion field in 2026-07 — here's the exact schema diff and how to update your handler."` beats `"A guide to Stripe webhook changes."`).

## 5. Quick Answer block (the AEO/GEO anchor)

This is the data-automation version of `write-article`'s opening-paragraph rule (step 2.3) — same job, with a required label and a stricter length target for snippet extraction.

- Heading it `## Quick Answer`, immediately after the title/intro line — no throat-clearing before it.
- **40-60 words.** Write to end cleanly inside the limit.
- State the concrete change and the concrete action: what broke or changed, and exactly what to update. For a genuine two-option comparison post, use "use X when..., use Y when..." form instead; don't force that framing onto a breaking-change post where it doesn't fit.
- Ground the answer in the real mechanism (what the API/pipeline actually does differently now), not a vague "this affects some integrations" hedge.

## 6. Structural Comparison Matrix (the Before/After analog)

This is data-automation's equivalent of `guides-fixes-article`'s Before/After code window and `dev-tools-article`'s Structural Comparison Matrix — the concrete artifact that earns the post's place. A markdown table comparing before/after behavior (old payload vs new payload, old rate limit vs new, old endpoint vs its replacement) across genuinely distinct operational dimensions:

```markdown
## Structural Comparison Matrix

| Operational Aspect | Before | After |
| :----------------- | :----- | :---- |
| **Dimension 1**    | ...    | ...   |
| **Dimension 2**    | ...    | ...   |
```

**Every cell must be true, not illustrative.** Same anti-fabrication rule as `dev-tools-article`: a rate limit, quota number, or latency figure needs a real source. If you haven't verified it (the API's own docs, the changelog, a reproduced call), describe it qualitatively instead of inventing a precise number. 3-5 rows is usually enough.

## 7. Pipeline / API / automation walkthrough

The hands-on payload the scope check in step 1 requires:

- Real request/response payloads, real webhook event JSON, or a real pipeline config snippet, not pseudocode. Redact real secrets/tokens/account IDs if the example is sourced from an actual account; never fabricate a plausible-looking secret either, use an obvious placeholder like `<your-api-key>`.
- **Verify every payload field and endpoint is accurate**, the same discipline `dev-tools-article` applies to CLI flags. If you can't verify the exact current shape, say so explicitly rather than presenting a guess as confirmed.
- Label multi-step pipeline changes (a workflow YAML diff, a handler function diff) the same way `guides-fixes-article` requires labeling each line of a multi-part fix.

## 8. Citations and internal links

Both required by `write-article` (external citation 1-3, internal links 2-4).

- **External (1-3):** the service's own official API docs, changelog, or status/changelog blog, not a secondary blog restating the same reference.
- **Internal (2-4):** the post's own category index (`/data-automation`) and any genuinely relevant tag page, plus the [pillar-cluster](../pillar-cluster/SKILL.md) entry's **Interlink target** if this post came from an approved cluster. Check `src/content/blog/*/index.mdx` for real collisions before finalizing a topic, same as `pillar-cluster` step 3.

## 9. FAQ block

Same rule as `write-article` step 2.8: only include questions a reader would genuinely still have after the body, in frontmatter `faq: [{question, answer}]`. Typical real questions for this category: does this affect existing integrations retroactively or only new ones, is there a grace period before the old behavior is removed, does a specific plan/tier change any of this.

## 10. Cover image

Follow the same anti-fabrication discipline as `dev-tools-article` and `guides-fixes-article`: **never use AI image generation to depict a payload, dashboard, or terminal screenshot for this category**, a fabricated-looking payload or dashboard screenshot undermines trust in a post whose whole premise is a verified integration change. `write-article` §3's abstract-illustration option (only when Pexels has no genuine fit) is still available for a genuinely conceptual post here, same constraints as there — it stays strictly non-representational, never a stand-in for a real captured payload.

- When the post centers on a real API/webhook payload or terminal output (a `curl` request, a pipeline log), generate deterministically from real captured or documented data with `scripts/make-terminal-cover.mjs`, same as the other two categories — `text` must be real, verified content, never invented.
- When the post centers on the Structural Comparison Matrix itself with no single dominant terminal/payload artifact, hand-build an SVG using the same brand palette (`INK #0B120F`, `SIGNAL #14957F`, `TRACE #6B7D77`, `PAPER #F4F2ED`, `ERROR_RED #E5484D`, 1600x900, rendered via `@resvg/resvg-js`) showing the real comparison categories from the post's own table.
- Check the actual cover image (not just alt text) of any sibling/interlinked post before finalizing, to rule out a near-duplicate layout.

## 11. Signal fields (Source + date, verbatim/paraphrased)

Kept from `pillar-cluster`'s general methodology, adapted for this category:

- **Verbatim/confirmed** = an exact, quotable string exists in the source: a specific field name in a payload schema, an exact deprecation notice, an exact error a webhook signature mismatch throws.
- **Paraphrased** = a described behavior change with no single literal string to quote (e.g. "webhook retries now back off exponentially instead of on a fixed interval").
- Every factual claim about how a service behaves needs a real source and date, verified the same way the dev-tools Wrangler pillar corrected an unverified summary against the primary changelog. Check the actual current API docs or changelog rather than stating what "used to be true" as current fact.

## 12. House style

Inherits `write-article`'s base rules on sentence/paragraph discipline, dashes (hyphens only, no em dash), the grammar/originality discipline gate, and E-E-A-T (see that skill's sections 4, 6, and 7). Nothing category-specific to add on top of those, beyond:

- **Tone: direct and operational, not hedged.** Write "Add the `apiVersion` field to every outgoing webhook handler," not "You might want to consider updating your webhook handler." Save nuance and trade-offs for the closing paragraph (`write-article` step 2.9), not the fix itself.

## 13. Before calling a data-automation draft done

Run `write-article`'s full checklist first, then check these on top:

- [ ] Primary keyword (breaking-change/comparison phrase) and 2-3 related terms were named before drafting.
- [ ] The topic genuinely requires a pipeline config, API call, webhook payload/handler, or automation script, not explainable with zero automation artifact.
- [ ] Title ≤60 chars, counted, not estimated.
- [ ] Meta description ≤160 chars, states the actual change and action, not just the topic.
- [ ] Quick Answer block is 40-60 words and states the concrete change plus the concrete action (or a genuine "use X when / use Y when" recommendation for a real comparison post).
- [ ] Structural Comparison Matrix has 3-5 genuinely distinct rows, and every cell is either a real sourced fact or an honest qualitative comparison, no invented precision numbers.
- [ ] Every payload field, endpoint, or config key shown is verified, not guessed, with an explicit note where it couldn't be independently confirmed.
- [ ] Any example secret/token/account ID is an obvious placeholder, never a real value and never a fabricated-but-plausible-looking one.
- [ ] 1-3 external citations link the service's actual official docs/changelog.
- [ ] 2-4 internal links include the `/data-automation` category index and any pillar-cluster interlink target.
- [ ] `src/content/blog` was checked for real topic collisions before finalizing, not assumed clear.
- [ ] FAQ was genuinely considered, added only if real distinct questions exist.
- [ ] Cover image is generated from real captured/documented data (terminal script) or a hand-built SVG using the documented palette and the post's real comparison data — or, only if Pexels had no genuine fit, a generated abstract illustration checked for garbled pseudo-text. Never a generated image standing in for a real captured artifact, never invented text/numbers.
- [ ] Cover image was compared against sibling/interlinked posts' actual images to rule out a near-duplicate layout.
- [ ] `.claude/content-plans/data-automation.md` (if it exists) has this entry flipped to `written` with the real slug filled in.
- [ ] Tone reads as direct and operational, not hedged.
