---
name: ai-productivity-article
description: Apply the AI Productivity SEO/AEO/GEO blueprint (model/tool-use/prompting keyword targeting, Quick Answer block, Structural Comparison Matrix, hands-on model-call/tool-schema/agent-config scope requirement, verbatim capability/schema sourcing, citations, internal linking, FAQ, natural non-generated sentence rhythm, human dashes only) when drafting a post in the ai-productivity category. Use together with write-article — write-article covers general structure/tone/checklist, this skill layers the category-specific model/agent/prompting format on top. Only applies when the post's category is ai-productivity.
---

This is an addendum to `write-article`, not a replacement — run both. `write-article` covers title/description caps, banned phrases, cover image sourcing, and the general checklist (which now also carries the site-wide sentence-discipline/dash/E-E-A-T rules this category inherits). This skill covers what's specific to `ai-productivity`: a reader integrating a model API, building agent tooling, or configuring an AI coding assistant, who needs to know what changed and exactly what to update, not a concept explainer or a "future of AI" think piece.

## 1. Scope check

Only apply this blueprint when `category: ai-productivity` in the post's frontmatter. If the post originated from an approved [pillar-cluster](../pillar-cluster/SKILL.md) entry, pull its **Source + date**, **verbatim/paraphrased label**, and **Interlink target** straight from that plan — don't re-research from scratch if it's already sourced.

If `.claude/content-plans/ai-productivity.md` exists, find this topic's entry there and confirm its **Status** is `approved` (not still `pending`) before drafting. Once the MDX file is created, flip that entry's Status to `written` and fill in its Slug.

**Hands-on constraint, checked before drafting starts:** every ai-productivity post must require touching a model API call, a tool/function-calling schema, an agent or MCP config, or a prompt/system-instruction, the ai-productivity equivalent of [dev-tools-article](../dev-tools-article/SKILL.md)'s terminal/config requirement and [data-automation-article](../data-automation-article/SKILL.md)'s pipeline/API requirement. If a topic is explainable with no model call, schema, or config artifact involved ("AI will change how developers work" is not a cluster), it isn't an ai-productivity structural cluster, even if it's real and timely.

## 2. Before drafting: keyword targeting

Same discipline as `write-article` step 1, made concrete for a model/agent/prompting post:

- **Primary keyword/phrase** is usually a breaking change ("X model ID deprecated," "Y tool-use schema changed"), a capability shift (a regression, a new parameter), or a genuine comparison ("X vs Y for agent tool-calling"), not a verbatim console error the way `guides-fixes` uses one.
- **2-3 related terms**: the model/provider/SDK name and version, the specific API parameter/schema field/MCP capability at the center of the post, and the underlying workflow it affects (e.g. "agent tool-calling," "prompt caching," "coding assistant context window"). Write these down before drafting.

## 3. Title

Same 60-character cap as every post (`src/content.config.ts`), build-enforced. Model names and version strings run long fast — count before finalizing, don't estimate.

## 4. Meta description

`content.config.ts` caps `description` at 160 chars, build-enforced. For ai-productivity it should state the actual change and the action, not just the topic (`"Claude's tool_choice parameter adds a new required option in 2026-07 — here's the exact schema change and how to update your agent."` beats `"A guide to Claude tool-use changes."`).

## 5. Quick Answer block (the AEO/GEO anchor)

This is the ai-productivity version of `write-article`'s opening-paragraph rule (step 2.3) — same job, with a required label and a stricter length target for snippet extraction.

- Heading it `## Quick Answer`, immediately after the title/intro line — no throat-clearing before it.
- **40-60 words.** Write to end cleanly inside the limit.
- State the concrete change and the concrete action: what changed or broke, and exactly what to update. For a genuine two-option comparison post, use "use X when..., use Y when..." form instead; don't force that framing onto a breaking-change post where it doesn't fit.
- Ground the answer in the real mechanism (what the model/tool/agent actually does differently now), not a vague "this affects some workflows" hedge or a marketing-style capability claim.

## 6. Structural Comparison Matrix (the Before/After analog)

This is ai-productivity's equivalent of `guides-fixes-article`'s Before/After code window and the other two categories' Structural Comparison Matrix — the concrete artifact that earns the post's place. A markdown table comparing before/after behavior (old schema vs new schema, deprecated model vs current model, old parameter default vs new) across genuinely distinct operational dimensions:

```markdown
## Structural Comparison Matrix

| Operational Aspect | Before | After |
| :----------------- | :----- | :---- |
| **Dimension 1**    | ...    | ...   |
| **Dimension 2**    | ...    | ...   |
```

**Every cell must be true, not illustrative.** Same anti-fabrication rule as the other two categories: a benchmark score, latency figure, or capability claim needs a real source (an official model card, a changelog, a reproduced call). If you haven't verified it, describe it qualitatively instead of inventing a precise number. This matters more here than anywhere else on the site — model capability claims are the single easiest thing on this site to fabricate convincingly, since a plausible-sounding benchmark number is trivial to invent and hard for a reader to catch. 3-5 rows is usually enough.

## 7. Model call / tool schema / agent config walkthrough

The hands-on artifact the scope check in step 1 requires:

- Real request/response payloads, real tool-use/function-calling schema JSON, or a real agent/MCP config snippet, not pseudocode. Redact real API keys; never fabricate a plausible-looking one either, use an obvious placeholder like `<your-api-key>`.
- **Verify every parameter, field, and model ID is accurate**, the same discipline `dev-tools-article` applies to CLI flags and `data-automation-article` applies to endpoints. If you can't verify the exact current shape or a specific model's exact capability, say so explicitly rather than presenting a guess as confirmed. Model IDs and capabilities change fast enough that a plausible-sounding one from training data is not the same as a verified current one.
- Label multi-step changes (a system-prompt diff, a tool-schema diff) the same way `guides-fixes-article` requires labeling each line of a multi-part fix.

## 8. Citations and internal links

Both required by `write-article` (external citation 1-3, internal links 2-4).

- **External (1-3):** the provider's own official API docs, model card, or changelog, not a secondary blog or a listicle restating the same reference. This category is especially prone to secondary sources repeating stale or wrong information about model capabilities; the primary source is non-negotiable here.
- **Internal (2-4):** the post's own category index (`/ai-productivity`) and any genuinely relevant tag page, plus the [pillar-cluster](../pillar-cluster/SKILL.md) entry's **Interlink target** if this post came from an approved cluster. Check `src/content/blog/*/index.mdx` for real collisions before finalizing a topic, same as `pillar-cluster` step 3.

## 9. FAQ block

Same rule as `write-article` step 2.8: only include questions a reader would genuinely still have after the body, in frontmatter `faq: [{question, answer}]`. Typical real questions for this category: does this affect an older model version too, is there a deprecation grace period, does this change behavior silently or does it throw an error.

## 10. Cover image

Follow the same anti-fabrication discipline as the other two categories: **never use AI image generation to depict a terminal, API response, or schema screenshot for this category**, which would be a genuinely awkward double standard to violate given the topic. A fabricated-looking terminal/API-response screenshot undermines trust in a post whose whole premise is a verified capability or schema change. `write-article` §3's abstract-illustration option (only when Pexels has no genuine fit) is still available for a genuinely conceptual post here, same constraints as there — it stays strictly non-representational, never a stand-in for a real captured response.

- When the post centers on a real API request/response or terminal output, generate deterministically from real captured or documented data with `scripts/make-terminal-cover.mjs`, same as the other two categories — `text` must be real, verified content, never invented.
- When the post centers on the Structural Comparison Matrix itself with no single dominant terminal/payload artifact, hand-build an SVG using the same brand palette (`INK #0B120F`, `SIGNAL #14957F`, `TRACE #6B7D77`, `PAPER #F4F2ED`, `ERROR_RED #E5484D`, 1600x900, rendered via `@resvg/resvg-js`) showing the real comparison categories from the post's own table.
- Check the actual cover image (not just alt text) of any sibling/interlinked post before finalizing, to rule out a near-duplicate layout.

## 11. Signal fields (Source + date, verbatim/paraphrased)

Kept from `pillar-cluster`'s general methodology, adapted for this category:

- **Verbatim/confirmed** = an exact, quotable string exists in the source: a specific parameter name in an API schema, an exact deprecation notice, an exact model ID.
- **Paraphrased** = a described behavior change with no single literal string to quote (e.g. "the agent now retries tool calls with backoff instead of failing immediately").
- Every factual claim about a model's behavior or capability needs a real source and date, verified the same way the dev-tools Wrangler pillar corrected an unverified summary against the primary changelog, and the same way a data-automation cluster's EOL date was cross-checked against a conflicting first source. Check the actual current model card or API docs rather than stating remembered or plausible-sounding capabilities as current fact — this is the category where that discipline matters most.

## 12. House style

Inherits `write-article`'s base rules on sentence/paragraph discipline, dashes (hyphens only, no em dash), the grammar/originality discipline gate, and E-E-A-T (see that skill's sections 4, 6, and 7). Nothing category-specific to add on top of those, beyond:

- **Tone: direct and operational, not hedged or hyped.** Write "Add the `cache_control` block to the system prompt," not "You might want to consider exploring prompt caching." Avoid marketing language about AI capabilities entirely; this is a technical audience integrating with an API, not an audience being sold on AI.

## 13. Before calling an ai-productivity draft done

Run `write-article`'s full checklist first, then check these on top:

- [ ] Primary keyword (breaking-change/capability/comparison phrase) and 2-3 related terms were named before drafting.
- [ ] The topic genuinely requires a model call, tool schema, or agent/MCP config, not explainable with zero hands-on artifact.
- [ ] Title ≤60 chars, counted, not estimated.
- [ ] Meta description ≤160 chars, states the actual change and action, not just the topic.
- [ ] Quick Answer block is 40-60 words and states the concrete change plus the concrete action (or a genuine "use X when / use Y when" recommendation for a real comparison post).
- [ ] Structural Comparison Matrix has 3-5 genuinely distinct rows, and every cell is either a real sourced fact or an honest qualitative comparison, no invented benchmark numbers or capability claims.
- [ ] Every model ID, parameter, and schema field shown is verified against a primary source, not remembered or guessed, with an explicit note where it couldn't be independently confirmed.
- [ ] Any example API key is an obvious placeholder, never a real value.
- [ ] 1-3 external citations link the provider's actual official docs/model card/changelog, not a secondary source.
- [ ] 2-4 internal links include the `/ai-productivity` category index and any pillar-cluster interlink target.
- [ ] `src/content/blog` was checked for real topic collisions before finalizing, not assumed clear.
- [ ] FAQ was genuinely considered, added only if real distinct questions exist.
- [ ] Cover image is generated from real captured/documented data (terminal script) or a hand-built SVG using the documented palette and the post's real comparison data — or, only if Pexels had no genuine fit, a generated abstract illustration checked for garbled pseudo-text — never a generated image standing in for a real captured artifact, never invented text/numbers.
- [ ] Cover image was compared against sibling/interlinked posts' actual images to rule out a near-duplicate layout.
- [ ] `.claude/content-plans/ai-productivity.md` (if it exists) has this entry flipped to `written` with the real slug filled in.
- [ ] Tone reads as direct and operational, no marketing language about AI capabilities.
