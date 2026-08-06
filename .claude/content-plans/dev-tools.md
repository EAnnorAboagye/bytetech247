# Content Plan — Dev Tools

Status values: pending (researched, not yet approved) -> approved (user greenlit) -> written (MDX file exists in src/content/blog).

## Pillar

**Wrangler CLI's July 2026 Breaking Changes: What to Fix Before You Deploy**

- Status: written
- Slug: -
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
