# Content clusters (pillar-cluster keyword roadmap)

Each category's index page (`/dev-tools/`, `/data-automation/`, `/ai-productivity/`, `/guides-fixes/`) is the pillar page — it already lists the category description and every post in it, so no new page type is needed. Each row below is a cluster post: a specific, narrower topic that links back to its category pillar and to 1-2 sibling rows once drafted.

Keywords here are grounded in real search signal (Google results, "People also search for," and forum/Reddit thread phrasing captured 2026-07-30) — not guessed. Rows marked **firsthand** are topics this project has actually lived through; those are the strongest candidates to draft first, since they're what nobody else can credibly write.

Status values: `published` (already live), `planned` (not drafted yet). Update a row to `published` and link its slug once a draft goes live via the `write-article` skill.

## Dev Tools

Pillar: IDEs, CLIs, extensions, and the other software that speeds up how you build.

| #   | Topic                                                                                      | Intent     | Why it fits                                                                                                                                  | Status    |
| --- | ------------------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Git worktrees: working on multiple branches without the stash shuffle                      | how-to     | —                                                                                                                                            | published |
| 2   | Using git worktrees with AI coding agents (Claude Code, Cursor) for parallel sessions      | how-to     | Real 2026 trend (Vibe Kanban, Conductor, GitButler all surfaced) — direct sibling to post #1, and this project's own workflow. **firsthand** | planned   |
| 3   | The VS Code extensions worth installing in 2026 (and which ones to skip)                   | comparison | Confirmed top picks across multiple 2026 sources: Error Lens, GitLens, Copilot, Prettier, ESLint                                             | planned   |
| 4   | GitLens vs. plain git CLI: when inline blame is actually worth it                          | comparison | GitLens is the #2 recurring result across extension searches                                                                                 | planned   |
| 5   | Making ESLint and Prettier stop fighting each other                                        | fix        | Common real pain point; this project runs both together. **firsthand**                                                                       | planned   |
| 6   | Best VS Code extensions for TypeScript specifically                                        | how-to     | Distinct SERP result cluster, separate demand from general "best extensions"                                                                 | planned   |
| 7   | Git GUI vs. staying in the CLI: GitKraken, worktree managers, and when a UI actually helps | comparison | Real signal from "git worktree GUI tools" searches                                                                                           | planned   |
| 8   | Remote development over SSH in VS Code: setup and the gotchas                              | how-to     | Remote-SSH is a recurring named extension in every 2026 "best of" list                                                                       | planned   |
| 9   | The CLI tools worth installing on a fresh dev machine                                      | how-to     | Firsthand "what I actually install first" angle                                                                                              | planned   |
| 10  | Choosing between tmux, Zellij, and a worktree manager for parallel terminal sessions       | comparison | Extension of the worktree-tooling trend found in search                                                                                      | planned   |
| 11  | Monorepo dev setup with pnpm workspaces: what actually needs configuring                   | how-to     | Common evergreen dev-tools topic, natural depth-add to the category                                                                          | planned   |

## Data & Automation

Pillar: Pipelines, scripts, and workflow automation for moving and shaping data.

| #   | Topic                                                                                        | Intent     | Why it fits                                                                                | Status    |
| --- | -------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ | --------- |
| 1   | Automating deploys for a static site: Cloudflare Workers Builds vs. GitHub Actions           | comparison | —                                                                                          | published |
| 2   | wrangler-action v3 vs. v4: what changed and which one to use                                 | fix        | Direct "People also search for" result under this exact topic                              | planned   |
| 3   | Scheduling automated jobs with Cloudflare Cron Triggers                                      | how-to     | Natural extension of the Workers-automation pillar                                         | planned   |
| 4   | Setting up a staging + production pipeline for Cloudflare Workers                            | how-to     | Real signal: "CI/CD at the Edge... multi-environment"                                      | planned   |
| 5   | Deploying a Next.js app to Cloudflare Workers with GitHub Actions                            | how-to     | Confirmed real demand (freeCodeCamp + others ranking for it)                               | planned   |
| 6   | Automating IndexNow pings after every deploy                                                 | how-to     | This exact feature is built and live on this site. **firsthand**                           | planned   |
| 7   | Diagnosing a Cloudflare WAF rule that's silently blocking Googlebot                          | fix        | Real incident on this exact site this year — rare, high-value, reproducible. **firsthand** | planned   |
| 8   | Cloudflare KV vs. D1 for simple automation state                                             | comparison | Directly relevant to this stack (KV already used for counters/sessions)                    | planned   |
| 9   | Fixing Windows file-lock errors (EPERM) when a build collides with a running dev server      | fix        | Exact bug hit and fixed in this project. **firsthand**                                     | planned   |
| 10  | Wiring GitHub Actions secrets correctly for a Workers deploy                                 | how-to     | Mirrors this project's own docs/ENVIRONMENT.md setup                                       | planned   |
| 11  | A simple cron job vs. a real workflow tool: when automation needs more than `node script.js` | conceptual | Common decision point in data-automation searches                                          | planned   |

## AI Productivity

Pillar: Practical ways to use AI assistants and models in a real engineering workflow.

| #   | Topic                                                                                       | Intent     | Why it fits                                                                     | Status    |
| --- | ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- | --------- |
| 1   | Getting more out of AI coding assistants: a practical prompting guide                       | how-to     | —                                                                               | published |
| 2   | Claude Code vs. Cursor: which one actually fits your workflow                               | comparison | Very active 2026 topic — heavy Reddit/YouTube/blog volume found                 | planned   |
| 3   | MCP servers explained: what they are and why Claude Code uses them                          | conceptual | Recurring topic across current AI-coding-agent discussion                       | planned   |
| 4   | Managing parallel AI coding sessions with subagents                                         | how-to     | This project's own workflow this session. **firsthand**                         | planned   |
| 5   | Writing a CLAUDE.md file your AI assistant actually follows                                 | how-to     | This project has a real one, iterated on directly. **firsthand**                | planned   |
| 6   | Using background tasks and scheduled wakeups for long AI-assisted jobs                      | how-to     | Used extensively and directly in this project. **firsthand**                    | planned   |
| 7   | Controlling token usage and cost when running AI coding agents daily                        | how-to     | Confirmed real demand ("Claude Code vs Cursor token usage" search)              | planned   |
| 8   | Plan mode vs. diving straight into edits: when to make an AI assistant stop and check first | conceptual | Real feature, real judgment call made repeatedly in this project. **firsthand** | planned   |
| 9   | Building a reusable Claude Code skill file for a repeatable workflow                        | how-to     | Exactly what this project just did (the write-article skill). **firsthand**     | planned   |
| 10  | When to hand a task to an AI subagent vs. do it directly                                    | conceptual | Real recurring judgment call in this project's own workflow. **firsthand**      | planned   |
| 11  | Reviewing AI-generated diffs without rubber-stamping them                                   | how-to     | Natural pair to the existing prompting-guide post                               | planned   |

## Guides & Fixes

Pillar: Step-by-step fixes for specific, reproducible technical problems.

| #   | Topic                                                                                                                                                                | Intent | Why it fits                                                                                                                         | Status    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Fixing "Missing field 'author'" in Google's Rich Results Test for an Astro blog                                                                                      | fix    | —                                                                                                                                   | published |
| 2   | [Astro's silent whitespace-collapse bug: why `{a}` and `{b}` on separate lines lose the space between them](/guides-fixes/astro-whitespace-collapse-expression-bug/) | fix    | Reproduced three separate times in this exact project — genuinely rare, undocumented elsewhere in this specific form. **firsthand** | published |
| 3   | Diagnosing a Cloudflare WAF rule blocking Googlebot from your entire site                                                                                            | fix    | Same real incident as the data-automation row — this version framed as the general Search-Console-error fix. **firsthand**          | planned   |
| 4   | Why Astro's `image()` schema field can't validate real dimensions at parse time                                                                                      | fix    | Documented, real workaround already built in this project (`validate-cover-image.ts`). **firsthand**                                | planned   |
| 5   | Fixing "astro dev works, astro build fails"                                                                                                                          | fix    | Confirmed real, common search (GitHub issues, Reddit threads)                                                                       | planned   |
| 6   | Fixing Windows EPERM errors when rebuilding while `wrangler dev` is running                                                                                          | fix    | Exact bug hit and fixed in this project. **firsthand**                                                                              | planned   |
| 7   | [Fixing `<details>`/`<summary>` dropdowns that won't close on outside click](/guides-fixes/fixing-details-summary-dropdown-outside-click/)                           | fix    | Exact bug fixed in this project this session. **firsthand**                                                                         | published |
| 8   | Fixing image-caused layout shift (CLS) in an Astro blog                                                                                                              | fix    | Ties directly to this project's own Lighthouse CLS gate work                                                                        | planned   |
| 9   | Why your site shows old content right after a Cloudflare deploy (cache propagation)                                                                                  | fix    | Directly observed in this project's own deploy verification this session. **firsthand**                                             | planned   |
| 10  | Fixing a rejected or unreadable sitemap.xml in Google Search Console                                                                                                 | fix    | General version of the WAF-specific incident — broader search demand                                                                | planned   |
| 11  | Fixing scripts that stop re-running after Astro view-transition navigation                                                                                           | fix    | Real fix already made in this project (TOCSidebar scroll-spy). **firsthand**                                                        | planned   |

## Drafting order

Draft in small batches (2-3 at a time) through the `write-article` skill, not all at once — quality gate every post before starting the next. Prioritize **firsthand** rows first in each category: they're the only rows where this site can say something no competitor post already says, which is the entire point of the cluster.

Every new cluster post must link back to its category's pillar page and to at least one sibling row in the same table (via `relatedSlugs` or an inline contextual link) — the mutual linking is what turns a list of posts into an actual cluster, not just shared taxonomy.
