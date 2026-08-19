# Content Plan — Dev Tools

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar

**Wrangler CLI's July 2026 Breaking Changes: What to Fix Before You Deploy**

- Status: written
- Slug: wranglers-july-2026-breaking-changes
- Why pillar: Wrangler is the CLI every Cloudflare Workers developer runs on every deploy and every local dev session, including this site's own (`wrangler.toml`, `worker/index.ts`). Between 2026-07-01 and 2026-08-05, Wrangler shipped one explicit breaking change (service environments removed) plus nine more config/CLI-behavior changes spanning config-file format (`wrangler.toml`/`jsonc`, `cloudflare.config.ts`), local-dev tooling (observability, R2, VPC bindings), new CLI capability (`wrangler check startup`, device-grant login), and CI/agent automation (naming-prompt skip) — ten genuinely distinct, non-overlapping, hands-on angles under one actively-shipping CLI, confirmed in-window against the real changelog and release dates, not a guessed range.

## Clusters

### 1. Wrangler Removes Service Environments (v4.111.0)

- Status: written
- Slug: wrangler-4-111-removes-service-environments
- Search Intent / Signal: `"Remove support for service environments and the legacy_env configuration field"` — verbatim confirmed, labeled Breaking Change in the changelog.
- Structural Problem: Wrangler used to let one Worker script serve multiple named environments (`[env.staging]`, `[env.production]`) sharing a single deployed Worker via the `legacy_env` config field. v4.111.0 removes that field entirely — Wrangler now always deploys each environment as its own independent Worker named `<name>-<environment>`. Anyone with CI/CD scripts, DNS routes, or dashboards referencing the old single-Worker-multiple-env model needs to re-point everything at the new per-environment Worker names, or config parsing errors out.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.111.0, released 2026-07-15
- Interlinks: none yet

### 2. Fix Wrangler wrangler.toml vs jsonc Precedence

- Status: written
- Slug: wrangler-toml-vs-jsonc-precedence
- Search Intent / Signal: described friction, paraphrased — no single verbatim error string; the real problem is Wrangler accepting both `wrangler.toml` and `wrangler.jsonc`/`wrangler.json` in the same project with no enforced precedence rule and no built-in migration command.
- Structural Problem: Wrangler parses whichever config file(s) it finds without a documented, parse-time-enforced precedence rule when both exist, and there's no `wrangler config migrate` subcommand yet to convert one format to the other safely (preserving comments/formatting) — so teams migrating have to do it by hand with no tooling safety net. This site's own deploy config is still on `wrangler.toml`, making this a genuinely first-person, dogfooded angle rather than a hypothetical.
- Source: cloudflare/workers-sdk issue #14501, opened 2026-07-01
- Interlinks: none yet (this repo's own `wrangler.toml` is the real example)

### 3. Wrangler 4.117 Drops containerEngine From Miniflare

- Status: written
- Slug: wrangler-4-117-removes-containerengine-miniflare
- Search Intent / Signal: `"Remove containerEngine from the worker options returned by unstable_getMiniflareWorkerOptions"` — verbatim confirmed.
- Structural Problem: custom local-testing harnesses that call the unstable Miniflare integration API directly (common in advanced Vitest setups) and read `containerEngine` off the returned worker-options object get `undefined` after upgrading — the field moved to being set at the Miniflare instance level instead of per-worker options, so code built against the old shape silently reads the wrong value instead of erroring loudly.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.117.0, released 2026-07-31
- Interlinks: none yet

### 4. Wrangler's New cloudflare.config.ts settings Export

- Status: written
- Slug: wrangler-cloudflare-config-ts-settings-export
- Search Intent / Signal: `"Add a settings export to the experimental cloudflare.config.ts config"` — verbatim confirmed.
- Structural Problem: account-level settings (account ID, compliance region) that used to live inline in a Worker's own config now need a dedicated `settings` export in the experimental `cloudflare.config.ts` file — a config-shape change that silently stops applying those settings if the export isn't added, for anyone who opted into the experimental TypeScript config format.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.113.0, released 2026-07-21
- Interlinks: none yet

### 5. Wrangler Now Traces Local Dev by Default (v4.118)

- Status: written
- Slug: wrangler-local-dev-observability-default-on
- Search Intent / Signal: `"Enable local observability capture by default in dev"` (v4.118.0) building on `"Add local-dev observability"` (v4.114.0) — verbatim confirmed.
- Structural Problem: `wrangler dev` and the Cloudflare Vite plugin now capture request traces and console logs into the Local Explorer's Observability tab automatically, running extra per-worker collector/streaming-tail services in the background by default. This can conflict with multi-process dev-registry setups or add overhead that wasn't there pre-upgrade, and the opt-out (`X_LOCAL_OBSERVABILITY=false`) isn't documented anywhere near the `wrangler dev` command itself.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.118.0 (released 2026-07-31) and wrangler@4.114.0 (released 2026-07-23)
- Interlinks: none yet

### 6. Check Worker Bundle Size With wrangler check startup

- Status: written
- Slug: wrangler-check-startup-bundle-size
- Search Intent / Signal: `"Graduate wrangler check startup from alpha and show bundle size"` — verbatim confirmed. Not a breaking change — a genuine new capability worth adopting.
- Structural Problem: `wrangler check startup` is no longer alpha-gated and now reports the Worker's actual bundle size, giving a real terminal command to catch startup-time/bundle-bloat problems before a deploy that would otherwise only surface as a slow cold start or a dashboard warning after the fact.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.116.0, released 2026-07-30
- Interlinks: none yet

### 7. Wrangler Skips Naming Prompts in Agent/CI Deploys

- Status: written
- Slug: wrangler-skips-naming-prompts-ci-deploys
- Search Intent / Signal: `"Avoid Worker and workers.dev naming prompts in agent-driven deploys"` — verbatim confirmed.
- Structural Problem: `wrangler deploy` used to block on interactive naming prompts the first time a Worker/workers.dev subdomain was created — a real problem for any non-interactive CI pipeline (like this site's own GitHub Actions deploy) or an AI coding agent driving the CLI directly, since there's no terminal human available to answer the prompt. This release detects that non-interactive context and skips the prompt automatically.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.116.0, released 2026-07-30
- Interlinks: `automate-static-site-deploys-github-actions-cloudflare-workers` (data-automation post on this exact site's CI deploy pipeline)

### 8. New r2_buckets Local Dev Credentials in Wrangler

- Status: written
- Slug: wrangler-r2-buckets-local-dev-credentials
- Search Intent / Signal: `"Add experimental local_dev.experimental_s3_credentials to r2_buckets config"` — verbatim confirmed.
- Structural Problem: local R2 bucket testing previously had no way to supply real S3-compatible credentials scoped just to local dev — every local `wrangler dev` session either shared production-adjacent credentials or faked R2 entirely. This adds a config-level place to scope credentials specifically to local development, requiring a new nested key added to an existing `r2_buckets` binding block.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.115.0, released 2026-07-28
- Interlinks: none yet

### 9. VPC Bindings Now Connect in Wrangler Local Dev

- Status: written
- Slug: wrangler-vpc-bindings-local-dev-connect
- Search Intent / Signal: `"Support connect() on remote VPC Network and VPC Service bindings in local development"` — verbatim confirmed.
- Structural Problem: VPC Network/Service bindings previously couldn't be exercised locally at all — any code path calling `.connect()` on one had to be stubbed out or skipped until a real deploy. This closes that local-dev gap, requiring readers to update their local dev setup and test scripts to use the new capability instead of their old stub/workaround.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.115.0, released 2026-07-28
- Interlinks: none yet

### 10. Wrangler Login Now Supports OAuth Device Grant

- Status: written
- Slug: wrangler-login-oauth-device-grant
- Search Intent / Signal: `"Add support for OAuth 2.0 Device Authorization Grant to wrangler login"` — verbatim confirmed.
- Structural Problem: `wrangler login`'s default flow opens a local browser to complete OAuth, which fails outright in headless/SSH/remote-container environments with no browser to open. The Device Authorization Grant flow instead prints a code and a URL to visit from any device, letting a fully headless terminal session (CI runner, remote sandbox, SSH box) authenticate without ever needing a local browser.
- Source: cloudflare/workers-sdk `packages/wrangler/CHANGELOG.md`, wrangler@4.119.0, released 2026-08-05
- Interlinks: none yet

# Pillar 2

## Pillar

**GitHub Actions' Summer 2026 Security & Config Overhaul: What to Change in Your Workflows**

- Status: written
- Slug: github-actions-summer-2026-security-config-overhaul
- Series: `github-actions-summer-2026-overhaul`
- Hub article: **Yes** — user approved a standalone hub, matching the existing dev-tools pillar's precedent (`wranglers-july-2026-breaking-changes`).
- Why pillar: Between 2026-06-11 and 2026-07-30, GitHub shipped a dense, coordinated wave of Actions changes — a genuine breaking checkout default, a self-hosted-runner version cutoff with an active brownout schedule, a new repo/org-level permission surface (workflow execution protections), a cache-token security tightening, and several new workflow-syntax capabilities (parallel steps, self-repo action references, layered custom images, agentic workflows) — all confirmed directly against github.blog/changelog with real dates, none of them a duplicate of this site's existing Wrangler pillar (which covers the Cloudflare CLI, not GitHub's own Actions platform). Every one of the 10 clusters requires editing a `.github/workflows/*.yml` file or a repo/org Settings screen to act on, matching this category's hands-on convention. This site runs its own deploys through `.github/workflows/ci.yml` (`actions/checkout@v7`, `push`/`pull_request` triggers, GitHub-hosted `ubuntu-latest` runners), which gives real first-person standing to discuss `actions/checkout` defaults and workflow triggers directly — though, as noted per-cluster below, several of these changes target attack surfaces (fork PRs via `pull_request_target`, self-hosted runners) this repo does not actually have, and the plan says so honestly rather than forcing a dogfooding claim.

## Clusters (Pillar 2)

### 11. actions/checkout v7 Blocks pull_request_target PRs

- Status: written
- Slug: actions-checkout-v7-blocks-pull-request-target-prs
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 2 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 11)
- Search Intent / Signal: `"actions/checkout refuses to fetch fork pull request code in pull_request_target and workflow_run workflows"` — verbatim confirmed (paraphrased slightly from the changelog's own wording; the specific insecure input patterns it blocks — `ref: refs/pull/${{ github.event.pull_request.number }}/merge`, `ref: ${{ github.event.pull_request.head.sha }}`, `repository: ${{ github.event.pull_request.head.repo.full_name }}` — are verbatim confirmed from the changelog).
- Structural Problem: `pull_request_target` runs with the base repo's full secrets/permissions but was historically paired with checkout steps that pulled in the _fork's_ untrusted head commit — the classic "pwn request" pattern that lets attacker-controlled code execute with the workflow's privileges. `actions/checkout` v7.0.0 (2026-06-18) refuses to check out a fork PR head/merge ref inside `pull_request_target` or PR-flavored `workflow_run` events by default; the fix backported to all supported major versions (v6.1.0, v5.1.0, v4.4.0, v3.7.0, v2.8.0, all 2026-07-20) with enforcement for those backports moved to 2026-07-20. Floating major-tag pins (`@v4`) picked this up automatically; SHA/minor/patch-pinned workflows need an explicit version bump, or `allow-unsafe-pr-checkout: true` if the unsafe pattern is genuinely intended and has been reviewed.
- Proposed H1: `actions/checkout v7 Blocks pull_request_target PRs`
- Source: github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/ (2026-06-18, enforcement date 2026-07-20); corroborated by github.com/actions/checkout/releases (v7.0.0 2026-06-18, v6.1.0 backport 2026-07-20)
- Interlinks: `automate-static-site-deploys-github-actions-cloudflare-workers` (this site's own GitHub Actions deploy pipeline post — honest dogfooding note: this repo's `ci.yml` only triggers on `push`/`pull_request` from the same repo, never `pull_request_target` or fork PRs, so this specific default change does not affect this repo's own workflows; worth saying so explicitly rather than overclaiming)

### 12. GitHub Actions: Upgrade Self-Hosted Runners by Jul 31

- Status: written
- Slug: github-actions-upgrade-self-hosted-runners-july-31
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 3 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 12)
- Search Intent / Signal: `"The runner must be on version 2.329.0 or later"` — verbatim confirmed. Brownout/enforcement schedule (four weeks of escalating restrictions, 11:00 AM-3:00 PM ET) — verbatim confirmed.
- Structural Problem: GitHub is enforcing a minimum self-hosted runner version for registration and a 30-day-from-release install window for job execution, rolling out as escalating brownout windows before full enforcement. Full enforcement begins 2026-07-31 for GitHub Enterprise Cloud with Data Residency and 2026-09-25 for standard GitHub Enterprise Cloud. Runners below the minimum version silently fail to register or pick up jobs once a brownout window (or full enforcement) hits, which reads to an unprepared team as workflows randomly queuing or failing with no code change on their end — the fix is a terminal-level runner software upgrade (or enabling auto-update), not a workflow YAML change.
- Proposed H1: `GitHub Actions: Upgrade Self-Hosted Runners by Jul 31`
- Source: github.blog/changelog/2026-06-12-github-actions-minimum-version-enforcement-timeline-for-self-hosted-runners/ (2026-06-12)
- Interlinks: none yet — honest dogfooding note: this repo runs entirely on GitHub-hosted `ubuntu-latest` runners (see `ci.yml`), not self-hosted runners, so this cluster does not affect this repo directly; included because self-hosted runners are a large share of the dev-tools audience running GitHub Actions at scale

### 13. Set Up GitHub Actions Workflow Execution Protections

- Status: written
- Slug: github-actions-workflow-execution-protections
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 4 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 13)
- Search Intent / Signal: `"Workflow execution protections are built on the GitHub rulesets framework"` and `"let you define an allow list that controls who can trigger GitHub Actions workflows and which events are permitted to run them"` — verbatim confirmed.
- Structural Problem: Historically, anyone with write access to a repo could modify a workflow file to run arbitrary code with the repo's secrets, and any permitted event (`push`, `pull_request_target`, `workflow_dispatch`) could trigger a workflow with no allow-list in front of it. Workflow execution protections (public preview, 2026-06-18) add a new "Policies" section under Actions settings, layered on the rulesets engine, with two independently configurable rule types: actor rules (who — individual users, repo roles, GitHub Apps, Copilot, Dependabot) and event rules (which events — `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, etc. are permitted at all). Configurable at enterprise, organization, and repository level, so even a repo not in an Enterprise org can, per GitHub's docs, opt in at the repo-settings level.
- Proposed H1: `Set Up GitHub Actions Workflow Execution Protections`
- Source: github.blog/changelog/2026-06-18-control-who-and-what-triggers-github-actions-workflows/ (2026-06-18); corroborated by docs.github.com/en/organizations/managing-organization-settings/actions-policies/workflow-execution-protections
- Interlinks: cluster 11 (`actions/checkout v7 Blocks pull_request_target PRs`) — both address the same `pull_request_target`/fork-PR attack surface from different angles (default checkout behavior vs. who can trigger the event at all)

### 14. Approve Workflow Runs From github-actions[bot] PRs

- Status: written
- Slug: approve-workflow-runs-github-actions-bot-prs
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 5 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 14)
- Search Intent / Signal: `"Requiring approval is a security measure to ensure generated code does not automatically run workflows which may have access to sensitive information"` — verbatim confirmed.
- Structural Problem: Pull requests opened by `github-actions[bot]` (e.g., from a scheduled workflow that commits changes and opens a PR) previously could not trigger CI/CD workflows at all, which meant bot-authored PRs could get merged without the usual test/lint/build gate ever running. As of 2026-06-11, bot-created PRs can trigger workflows, but only after a repo collaborator with write access approves the run — aligning bot PRs with how Copilot-authored PR workflow runs are already gated, and hanging off the existing repo Settings -> Actions -> General checkbox that governs whether Actions can create and approve pull requests.
- Proposed H1: `Approve Workflow Runs From github-actions[bot] PRs`
- Source: github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved/ (2026-06-11)
- Interlinks: none yet

### 15. GitHub Actions Cache Goes Read-Only on Untrusted Triggers

- Status: written
- Slug: github-actions-cache-read-only-untrusted-triggers
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 6 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 15)
- Search Intent / Signal: `"read-only cache tokens to the default branch for workflow events that can be triggered without write permissions to the repository"` — verbatim confirmed. `"arbitrary code and exfiltrate production secrets"` — verbatim confirmed (describing the risk this closes).
- Structural Problem: Actions cache tokens used to be read-write for every triggering event, including "untrusted" ones like `pull_request_target`, `issue_comment`, and fork-originated `workflow_run` cascades — where someone other than a repo collaborator can cause the event. That let an external contributor poison the default-branch cache (script injection into a cached dependency, build artifact, etc.), which a later trusted workflow run would then restore and execute with full privileges. As of 2026-06-26, untrusted-trigger events touching a default-branch cache scope get read-only tokens; `push`, `schedule`, `workflow_dispatch`, and `repository_dispatch` keep read-write. Teams that legitimately need to populate caches from a restricted context now need a second, trusted-trigger workflow dedicated to cache saves — a structural change to how the workflow files are split, not a one-line fix.
- Proposed H1: `GitHub Actions Cache Goes Read-Only on Untrusted Triggers`
- Source: github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers/ (2026-06-26)
- Interlinks: none yet

### 16. Reference Same-Repo Actions With $/ Syntax

- Status: written
- Slug: github-actions-self-repository-dollar-slash-syntax
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 7 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 16)
- Search Intent / Signal: `"A uses: value that starts with $/ resolves to your workflow's own repository at the exact commit that is running, with no checkout required"` — verbatim confirmed. `"makes it possible to adopt the enterprise policy that requires actions to be pinned to a full-length commit SHA"` — verbatim confirmed.
- Structural Problem: Referencing an action or reusable workflow defined in the same repo used to force a choice between `./`-relative paths (which require an explicit checkout step first) or hardcoding a version/SHA (which drifts out of sync with the calling workflow's own ref). The new `$/` prefix (2026-07-30, requires Actions runner 2.336.0+) resolves to the calling workflow's own repository at the exact commit currently executing, with no checkout step needed, and composes with pinned-SHA enterprise policies since the resolution itself is commit-exact.
- Proposed H1: `Reference Same-Repo Actions With $/ Syntax`
- Source: github.blog/changelog/2026-07-30-reference-same-repository-actions-with-self-repository-syntax/ (2026-07-30)
- Interlinks: cluster 12 (self-hosted runner minimum version) — different runner-version floor (2.336.0 here vs. 2.329.0 there), worth cross-referencing so readers don't conflate the two version requirements

### 17. Run GitHub Actions Steps in Parallel With background

- Status: written
- Slug: github-actions-parallel-steps-background-keyword
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 8 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 17)
- Search Intent / Signal: `"background: true"` runs a step asynchronously and immediately continues to the next step`, plus `wait`/`wait-all`, `cancel`, and `parallel` keywords — verbatim confirmed from the changelog's own description. Not a breaking change — a new capability worth adopting, same convention as the existing Wrangler pillar's capability-only clusters.
- Structural Problem: Workflow steps have always executed strictly sequentially, which forces artificial serialization on genuinely independent work (parallel builds, spinning up a service before a dependent step, background non-blocking tasks). The 2026-06-25 release adds `background: true` to run a step async and move on immediately, `wait`/`wait-all` to block until named or all background steps finish, `cancel` to terminate a background step early, and `parallel` as sugar that runs a whole step group concurrently with automatic waiting — all new YAML keys inside existing `steps:` blocks, not a new job/workflow structure.
- Proposed H1: `Run GitHub Actions Steps in Parallel With background`
- Source: github.blog/changelog/2026-06-25-actions-steps-can-now-be-run-in-parallel/ (2026-06-25)
- Interlinks: none yet

### 18. Restrict GitHub-Hosted Runners to Named Runner Groups

- Status: written
- Slug: restrict-github-hosted-runners-named-runner-groups
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 9 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 18)
- Search Intent / Signal: `"disable the standard labels for hosted runners such as ubuntu-latest"` and `"add macOS runners to runner groups"` — verbatim confirmed. Team/Enterprise plans only, per the changelog.
- Structural Problem: Standard hosted-runner labels (`ubuntu-latest`, `macos-latest`, etc.) resolve to GitHub's shared runner pool with no org-level access control — any workflow in any repo that can use Actions at all can request one. The 2026-06-25 release lets Team/Enterprise admins disable the standard labels org-wide and force all jobs to route through named, permissioned runner groups instead (with macOS runners now addable to groups for the first time), which means every existing `runs-on: ubuntu-latest` line in every workflow in the org breaks the moment the standard labels are disabled, until it's rewritten to reference a runner group by name.
- Proposed H1: `Restrict GitHub-Hosted Runners to Named Runner Groups`
- Source: github.blog/changelog/2026-06-25-more-control-over-your-github-hosted-runners/ (2026-06-25)
- Interlinks: none yet — honest note: Team/Enterprise-only, and this repo (`ci.yml` uses `runs-on: ubuntu-latest` directly) is not on a plan where this applies, so no dogfooding claim here

### 19. Build Custom GitHub Actions Runner Images in Layers

- Status: written
- Slug: github-actions-layered-custom-runner-images
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 10 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 19)
- Search Intent / Signal: `"build custom images on top of other custom images"` — verbatim confirmed. Conditional statements around the `snapshot` keyword — verbatim confirmed, described as a new capability rather than a breaking change.
- Structural Problem: Custom runner images previously had to be built flat and independently — a team with a shared base image (common tooling, base OS config) and several sub-teams each needing their own extra dependencies had no way to compose images, so every team either duplicated the base image build or maintained one bloated shared image. The 2026-06-18 release allows layering custom images on top of other custom images, and adds conditional logic around the `snapshot` keyword in workflow YAML so image-version generation can be gated on conditions instead of running unconditionally on every build.
- Proposed H1: `Build Custom GitHub Actions Runner Images in Layers`
- Source: github.blog/changelog/2026-06-18-actions-build-custom-images-from-custom-images/ (2026-06-18)
- Interlinks: cluster 18 (runner groups) — both concern GitHub-hosted/custom runner infrastructure, worth cross-linking since a team adopting layered custom images is also a likely candidate for named runner groups

### 20. Set Up GitHub Agentic Workflows in Actions

- Status: written
- Slug: github-actions-agentic-workflows-setup
- Series: `github-actions-summer-2026-overhaul`
- SeriesOrder: 11 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 20)
- Search Intent / Signal: `"you can automate reasoning-based tasks like issue triage, CI failure analysis, and documentation updates by leveraging coding agents inside GitHub Actions"` — verbatim confirmed. Security-layer terms (`"integrity filter"`, `"Agent Workflow Firewall"`, `"safe outputs"`, `"threat detection"`) — verbatim confirmed.
- Structural Problem: Automating reasoning-based repo tasks (triage, CI-failure analysis, doc updates) previously meant hand-writing bespoke Actions YAML plus whatever LLM-calling glue code a team assembled themselves, with no standard security boundary around what an AI agent running inside CI could read, write, or execute. GitHub Agentic Workflows (public preview, 2026-06-11) instead compiles natural-language Markdown files into standard Actions YAML, defaults agents to read-only permissions, runs them sandboxed behind an "Agent Workflow Firewall," validates outputs through a "safe outputs" process, and runs a dedicated threat-detection job against proposed changes before they apply — a genuinely new config surface (Markdown-to-YAML compilation plus a CLI extension to install) rather than a breaking change to existing workflows.
- Proposed H1: `Set Up GitHub Agentic Workflows in Actions`
- Source: github.blog/changelog/2026-06-11-github-agentic-workflows-is-now-in-public-preview/ (2026-06-11)
- Interlinks: none yet — plausible future interlink to this site's own AI/LLM content (e.g. the LLM Token & Pricing Reset series) once an agentic-workflows cluster exists, since this is a CI/CD x AI-agent crossover topic, but no existing post covers this ground today

# Pillar 3

## Pillar

**GitHub CLI's 2026 Agent-Era Command Expansion**

- Status: written (2026-08-19)
- Slug: github-cli-2026-agent-era-expansion
- Series: `github-cli-agent-era-2026`
- Hub article: **Yes** — user approved a standalone hub (2026-08-19), matching every prior pillar's precedent on this site.
- Why pillar: User-supplied Google Keyword Planner export showed "github cli" pulling 50,000 avg. monthly searches (Low ad competition, +900% YoY — real surging interest), cross-referenced against live research per `content-planner`'s CSV-cross-reference mechanism (logged `.claude/content-plans/discovered-keywords.md`, 2026-08-19 entry). A dense, dated ~4-month wave of `gh` (cli/cli) releases — `gh skill` for cross-agent skill management (2026-04-16), a PGP signing-key rotation (2026-04-08), `gh discussion` and sub-issue/dependency management (both 2026-06-10, v2.94.0), and two security-driven point releases (v2.96.0, 2026-07-02; v2.97.0, 2026-07-31) — gives enough distinct, structural ground for 10 non-overlapping clusters, every one requiring a real terminal/CLI action (install, pin, run a command, update for security) to resolve, matching this category's hands-on bar. Confirmed via live research that this is specifically about the classic `gh` tool (`cli/cli`), not the separate GitHub Copilot CLI product (`github/copilot-cli`) — an early search result conflated the two before a disambiguating pass caught it. Checked against `src/content/blog/*/index.mdx` (grep for "github cli"/"gh cli"/"GitHub CLI") — zero collisions, this is genuinely new ground for the site.

## Clusters (Pillar 3)

### 21. gh skill: Manage AI Agent Skills From GitHub CLI

- Status: written (2026-08-19)
- Slug: gh-skill-manage-ai-agent-skills
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 2 (frontmatter value — hub is 1; this pillar's own series starts fresh, distinct from this plan file's running cluster-number 21)
- Search Intent / Signal: "install, pin, search, update, and publish agent skills" — verbatim confirmed (changelog).
- Structural Problem: Before `gh skill`, installing an agent skill (Claude Code, Copilot, Cursor, Codex, Gemini CLI, Antigravity) meant manually cloning/copying files per-agent with no standard install/update/publish flow. `gh skill` gives one CLI surface across all of them via its `--agent` flag.
- Proposed H1: `gh skill: Manage AI Agent Skills From GitHub CLI`
- Source: github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/ (2026-04-16)
- Interlinks: none yet — this is the pillar's own hub topic

### 22. gh skill --pin: Tag vs Commit SHA, Which to Use

- Status: written (2026-08-19)
- Slug: gh-skill-pin-tag-vs-commit-sha
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 3
- Search Intent / Signal: "gh skill install github/awesome-copilot documentation-writer --pin v1.2.0" — verbatim confirmed (official docs example).
- Structural Problem: pinning to a mutable git tag isn't fully reproducible — tags can be reassigned unless Immutable Release is enabled — while pinning to a commit SHA is the actually-safe option for CI/provisioning scripts. A distinction the flag's own docs surface but that's easy to get wrong on first use.
- Proposed H1: `gh skill --pin: Tag vs Commit SHA, Which to Use`
- Source: cli.github.com/manual/gh_skill_install (official manual, living doc) + github.blog 2026-04-16 changelog
- Interlinks: cluster 21

### 23. gh discussion: GitHub Discussions in Your Terminal

- Status: written (2026-08-19)
- Slug: gh-discussion-command-github-cli
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 4
- Search Intent / Signal: "gh discussion list, view, create, edit, comment" — verbatim confirmed (changelog command list).
- Structural Problem: GitHub Discussions previously had no first-class `gh` surface — anything beyond browsing meant falling back to raw `gh api` calls against the GraphQL Discussions API by hand. The new command group gives Discussions the same terminal ergonomics issues/PRs already had.
- Proposed H1: `gh discussion: GitHub Discussions in Your Terminal`
- Source: github.blog/changelog/2026-06-10-list-view-and-create-discussions-in-github-cli/ (2026-06-10)
- Interlinks: cluster 24 (shipped same release wave, v2.94.0)

### 24. Manage GitHub Sub-Issues and Dependencies via gh CLI

- Status: written (2026-08-19)
- Slug: gh-cli-sub-issues-dependencies
- NOTE (2026-08-19): live verification found the changelog's claimed `--set-parent` flag does not actually exist in the shipped CLI (only `--parent` and `--remove-parent` are registered) — the post documents this discrepancy explicitly rather than repeating the changelog's inaccurate claim.
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 5
- Search Intent / Signal: `--parent`, `--set-parent`, `--remove-parent` — verbatim confirmed (flag names from the changelog/PR).
- Structural Problem: issue hierarchy (types, parent/sub-issue relationships, cross-issue dependencies) was GitHub.com-UI-only before v2.94.0 — scripting or bulk-managing a project's issue tree required the API directly. These flags make hierarchy a first-class CLI operation.
- Proposed H1: `Manage GitHub Sub-Issues and Dependencies via gh CLI`
- Source: github.blog/changelog/2026-06-10-manage-sub-issues-types-and-dependencies-from-github-cli/ (2026-06-10); cli/cli PR #13057
- Interlinks: cluster 23

### 25. Update gh CLI Now: Codespace Jupyter RCE Fixed

- Status: written (2026-08-19)
- Slug: gh-cli-codespace-jupyter-rce-fixed
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 6
- Search Intent / Signal: "connecting to a malicious Codespace via gh codespace jupyter can allow command execution" — verbatim confirmed (GHSA advisory text).
- Structural Problem: from v2.10.0 through v2.95.0, `gh codespace jupyter` opened a JupyterLab URL supplied by the Codespace itself without validating it was a loopback address, so a crafted `vscode://` URL from inside a malicious/compromised Codespace could hand off command execution to VS Code on the user's machine — a real, dated, fixed vulnerability, not a hypothetical.
- Proposed H1: `Update gh CLI Now: Codespace Jupyter RCE Fixed`
- Source: GHSA-8cg3-r6g9-fpg2, cli/cli release v2.96.0 (2026-07-02)
- Interlinks: cluster 26 (next security release, same "update now" thread)

### 26. gh CLI 2.97.0 Fixes 4 Terminal Injection Bugs

- Status: written (2026-08-19)
- Slug: gh-cli-2-97-0-terminal-injection-fixes
- NOTE (2026-08-19): live verification found v2.97.0 fixed 4 SEPARATE security advisories that day (terminal injection, a URL-path-escaping bug, an auth-token leak, an attestation-verify bypass) — only one of which is the terminal-injection issue, which itself spans 7 commands, not "4 bugs." Final published title is "gh CLI 2.97.0 Fixes Terminal Injection in 7 Commands" to avoid repeating the conflated figure. The hub article may still use the imprecise "4" framing and needs a check during final QA.
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 7
- Search Intent / Signal: "printed externally controlled content without neutralizing terminal escape sequences" across `gh gist view`, `gh api`, `gh pr diff`, `gh release download --output -`, `gh codespace logs`, `gh skills preview`, `gh agent-task view/create` — verbatim confirmed (GHSA-3m3g-3wcr-px46 advisory text).
- Structural Problem: any of those seven commands could print attacker-controlled content (a gist body, an API response, a PR diff, agent-task output) containing raw terminal escape sequences, letting a malicious repo/gist/PR manipulate the victim's terminal the moment the command ran. v2.97.0 sanitizes escape sequences across all seven before they reach the terminal.
- Proposed H1: `gh CLI 2.97.0 Fixes 4 Terminal Injection Bugs`
- Source: GHSA-3m3g-3wcr-px46, cli/cli release v2.97.0 (2026-07-31)
- Interlinks: cluster 25, cluster 29 (`gh agent-task` is one of the seven affected commands)

### 27. gh release download No Longer Needs Auth (Public Repos)

- Status: written (2026-08-19)
- Slug: gh-release-download-no-auth-public-repos
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 8
- Search Intent / Signal: "gh release download now works against public repositories without authentication, matching gh extension install" — verbatim confirmed (v2.96.0 release notes).
- Structural Problem: previously, downloading a release asset from a public repo via `gh release download` required an authenticated session even though the repo/asset was public — CI pipelines pulling public release artifacts had to carry a token for no real access-control reason. v2.96.0 removes that requirement, aligning the command's auth behavior with `gh extension install`'s.
- Proposed H1: `gh release download No Longer Needs Auth (Public Repos)`
- Source: cli/cli release v2.96.0 (2026-07-02)
- Interlinks: cluster 25 (same release)

### 28. gh CLI's New PGP Signing Key for Linux Packages

- Status: written (2026-08-19)
- Slug: gh-cli-new-pgp-signing-key-linux
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 9
- Search Intent / Signal: "updated PGP keyring for GitHub CLI's Linux package repositories that includes both the current signing key and a new replacement key" — verbatim confirmed (changelog text).
- Structural Problem: Linux package-manager installs of `gh` (apt/yum-style repos) verify package signatures against a known PGP key. GitHub published a dual-key keyring (old + new) so installs/updates don't break mid-rotation — a real, dated action item for anyone provisioning `gh` via a Linux package manager or CI base image.
- Proposed H1: `gh CLI's New PGP Signing Key for Linux Packages`
- Source: github.blog/changelog/2026-04-08-new-pgp-signing-key-for-github-cli-linux-packages/ (2026-04-08)
- Interlinks: none yet

### 29. gh agent-task: Run Copilot Coding Sessions From gh

- Status: written (2026-08-19)
- Slug: gh-agent-task-copilot-coding-sessions
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 10
- Search Intent / Signal: "a task is a GitHub issue that triggers automated code changes from natural language instructions" — verbatim confirmed (official docs); the command is explicitly labeled "(preview)" — verbatim confirmed.
- Structural Problem: `gh agent-task` (create/view/list, still preview) is how `gh` itself drives GitHub's own asynchronous Copilot coding-agent sessions from the terminal — genuinely part of the same 2026 wave turning `gh` into a cross-agent control surface alongside `gh skill`, and one of the seven commands the July escape-sequence fix (cluster 26) touched, tying the pillar's "new agent surface" and "security hardening" threads together.
- Proposed H1: `gh agent-task: Run Copilot Coding Sessions From gh`
- Source: cli.github.com/manual/gh_agent-task (official manual, living doc); GHSA-3m3g-3wcr-px46 (2026-07-31, security-fix context)
- Interlinks: cluster 26, `github-actions-agentic-workflows-setup` (site's existing post on GitHub's Actions-side agentic tooling — natural cross-link, same "GitHub + AI agents" ground from a different product surface)

### 30. How GitHub CLI Became an AI-Agent Control Surface

- Status: written (2026-08-19)
- Slug: github-cli-ai-agent-control-surface
- Series: `github-cli-agent-era-2026`
- SeriesOrder: 11
- Search Intent / Signal: Synthesis/closing cluster, not a single dated announcement — ties together clusters 21, 23, 24, 29 (four genuinely new command surfaces shipped within one ~4-month window) plus clusters 25-26 (two security-driven releases in the same window).
- Structural Problem: four new command groups (skill, discussion, sub-issue management, agent-task's growing role) plus two security-driven point releases landed on `gh` between April and July 2026 — read individually each looks like a routine changelog entry, but together they show `gh` deliberately expanding from "GitHub's API wrapper" into a control surface for both repo hierarchy and AI-agent tooling, which is the actual reason to keep `gh` current rather than treat version bumps as optional.
- Proposed H1: `How GitHub CLI Became an AI-Agent Control Surface`
- Source: synthesis of clusters 21, 23, 24, 25, 26, 29 above
- Interlinks: cluster 21, cluster 23, cluster 24, cluster 29
