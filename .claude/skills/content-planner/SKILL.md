---
name: content-planner
description: Discover 1-5 fresh (<60-day) tech keywords via live web search across ByteTech247's four categories, shortlist them for approval, then hand each approved keyword to pillar-cluster for research/planning and write-article for drafting. Stops for explicit approval before the shortlist is researched and again before anything is committed/pushed. Use when asked to find new content topics, run a keyword scan, or start a new content cycle with no topic already in hand.
---

This is the stage that runs _before_ `pillar-cluster` — it answers "what should we even be researching right now," across categories, without the user already having named a topic. It does not do `pillar-cluster`'s research itself, and it does not draft anything: it discovers and shortlists keywords, then hands each approved one to the existing `pillar-cluster` → `write-article` chain unchanged, and stops before publish.

## 1. Resolve inputs before searching

**Defaults apply silently — don't ask the user to confirm these at the start of a run.** Only stop and ask if the user's own request already named a different number, window, or category scope for this specific run (e.g. "just find me 2" or "widen it to 90 days"); otherwise proceed straight to searching with the defaults below.

- **Category scope** — default to scanning across all four (`dev-tools`, `data-automation`, `ai-productivity`, `guides-fixes`); the user can narrow to one or more. If category balance is known to be uneven (check `src/content/blog/*/index.mdx` frontmatter counts per category), weight the scan toward the thinner categories rather than splitting evenly by default — this site's own content-system audit found `dev-tools`/`data-automation` sitting at roughly half the volume of the other two.
- **Keyword count** — default up to 5, minimum 1, per run. Never pad the shortlist to hit 5; a real 2-keyword shortlist beats a stretched 5-keyword one, the same discipline `pillar-cluster` §4 already applies to not stretching for a tenth cluster.
- **Freshness window** — default 60 days. "Fresh" means a real, dated source (an announcement, changelog entry, release, filed issue, or launch) from the last N _real_ calendar days, not the sandbox's system date. Check the actual publish/commit date on anything found, the same discipline `pillar-cluster` §1 already requires.

## 2. Live search — broad-but-shallow, not `pillar-cluster`'s deep dive

`pillar-cluster` §2 does deep, single-topic research (GitHub issues, changelogs, release notes) once a topic is already chosen. This step is the opposite shape: scan _across_ many candidate topics to find which ones are even worth that deep dive. Use real web search against:

- Official changelogs and release notes for the ecosystems this site already covers (Astro, Vite, Tailwind, TypeScript, Cloudflare Workers/Wrangler for `guides-fixes`/`dev-tools`; Cloudflare APIs and CI/CD platforms for `data-automation`; Claude/GPT/Gemini/MCP for `ai-productivity`) — matching `pillar-cluster` §1's "the site's own stack gives first-person authority" principle.
- Hacker News, GitHub Trending, and the target ecosystem's own community/discussion channels for emerging friction points not yet formalized into an issue.
- For each candidate keyword, capture the same fields `pillar-cluster` §2 requires for a cluster signal: the exact source (issue number, changelog entry, release, discussion thread), its real date, and whether it's a verbatim/confirmed signal or a paraphrased one. Never invent a fresher date or a more definitive signal than the source actually shows.

## 3. Apply `pillar-cluster`'s own pillar bar before shortlisting

Don't shortlist a keyword that would fail `pillar-cluster` §4 the moment it got there — check it here first, cheaply, before spending a full research pass on it later:

- Structural and timely (inside the 60-day window), not a generic "how to learn X" or "introduction to Y."
- Broad enough to plausibly support 10 distinct, non-overlapping sub-angles. If a candidate is clearly a single narrow fix with no room around it, it's a `guides-fixes` cluster candidate to raise standalone later, not a pillar-shaped keyword for this shortlist.
- Matches the category's hands-on constraint (`dev-tools-article`/`data-automation-article`/`ai-productivity-article` §1, `guides-fixes-article`'s verbatim-error premise) — a topic explainable with zero terminal/config/API/model artifact isn't a fit for any of the four categories as this site defines them.

## 4. Collision check

Before finalizing the shortlist, check both:

- `src/content/blog/*/index.mdx` frontmatter (`category`, `tags`, `title`) for existing coverage, the same check `pillar-cluster` §3 does.
- Every `.claude/content-plans/<category>.md` file for a pillar already `pending`/`approved`/`written` on the same ground, plus this skill's own log (§6 below) for a keyword already shortlisted in a prior run that hasn't been acted on yet.

Drop any candidate that collides; don't shortlist a near-duplicate of something already planned or published.

## 5. Present the shortlist and stop

Output, per candidate (1-5 total):

```
KEYWORD: <the fresh keyword/topic>
CATEGORY: <slug>
SOURCE: <exact source> — <real date>
SIGNAL: <verbatim [confirmed] or symptom [paraphrased]>
WHY THIS CLEARS THE PILLAR BAR: <1-2 sentences — structural, timely, broad enough>
```

This is a request for approval, not a request to start researching a full pillar — say so explicitly, the same way `pillar-cluster`'s own output says a plan isn't a request to start drafting. Wait for the user to approve specific keywords (or all of them, or none) before moving to step 6.

## 6. Log the shortlist

Write (or update) `.claude/content-plans/discovered-keywords.md` so a run can resume and future runs don't re-surface the same candidates:

```
# Discovered Keywords Log

## <date of this run>
- **<keyword>** (<category>) — Source: <source + date> — Status: shortlisted
```

Update each entry's Status as it moves: `shortlisted` → `approved` → `handed-to-pillar-cluster` (at which point `.claude/content-plans/<category>.md` is the source of truth for its actual pillar/cluster progress, same handoff `pillar-cluster` §7 already describes) → `rejected` (if the user declines it — keep the row rather than deleting it, so it isn't re-suggested next run without a reason visible).

## 7. Hand off approved keywords — unchanged downstream skills

For each approved keyword, invoke `pillar-cluster` exactly as documented there, with this keyword as its topic input. `pillar-cluster`'s own research (§2), collision check (§3), pillar selection (§4), cluster generation (§5), and — critically — its own plan-approval gate all stand unmodified: this skill does not skip or pre-approve that step. Once a pillar/cluster plan is approved there, hand approved clusters to `write-article` (plus the matching category skill) one at a time, exactly as `pillar-cluster` §0 already directs.

## 8. Before anything is committed or pushed, stop again

Once every approved cluster for a keyword's pillar is drafted, present a publish-readiness summary, not an assumption that drafting-done means shipping-ready:

- Every file changed (new posts, any `relatedSlugs`/`series` wiring on sibling posts).
- Confirmation the standard verification suite passed (`npm run check`, `npm run test:unit`, `npm run build` — same gates any other content change on this site goes through).
- Any citation or cover-image sourcing that couldn't be fully verified, flagged explicitly rather than silently shipped (matching `write-article` §6's Trustworthiness rule: an honest "not verified yet" beats a confident-sounding guess).

Wait for explicit approval before running `git add`/`commit`/`push`. This is a hard gate, not a formality: an unreviewed pipeline is exactly what let a real factual error and a real accessibility bug ship on this site before automated verification and citation research caught them after the fact. A keyword-shortlist approval and a pillar/cluster-plan approval upstream don't substitute for a final look at what's actually about to go live.

## 9. Before handing the shortlist back, check every one of these

- [ ] Category scope was resolved (all four, or the ones the user specified), weighted toward thinner categories by default when volume is uneven.
- [ ] 1-5 keywords shortlisted, never padded to hit the max.
- [ ] Every keyword has a real, dated source inside the 60-day window — checked against real calendar time, not the sandbox date.
- [ ] Every keyword would plausibly clear `pillar-cluster` §4's own pillar bar, not just "seems trending."
- [ ] `src/content/blog` and every `.claude/content-plans/*.md` file were checked for real collisions, not assumed clear.
- [ ] `.claude/content-plans/discovered-keywords.md` was written or updated to log this run.
- [ ] Output makes clear this is a shortlist for approval, not a request to start researching pillars.
- [ ] Downstream, `pillar-cluster` and `write-article` are invoked unmodified — their own approval gates are not skipped or pre-approved on the user's behalf.
- [ ] Nothing gets committed or pushed without a final, explicit publish approval after drafting is done.
