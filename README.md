# ByteTech247

A technical blog covering Dev Tools, Data & Automation, AI Productivity, and Guides & Fixes — built with Astro, MDX, and Tailwind CSS, deployed as a static site on Cloudflare Workers.

Full architecture, rationale, and phase-by-phase requirements live in [`build-spec.md`](./build-spec.md) — this README is the quick-start; that file is the source of truth for *why* things are built the way they are. [`ARCHITECTURE.md`](./ARCHITECTURE.md) is a short pointer into it. [`BUILD-GUARDRAILS.md`](./BUILD-GUARDRAILS.md) lists specific mistakes to avoid per phase.

## Requirements

- Node.js version pinned in [`.nvmrc`](./.nvmrc) (use `nvm use` if you have nvm installed)
- npm (lockfile is `package-lock.json` — don't switch package managers)

## Local development

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Content authoring

Posts live in `src/content/blog/<slug>/index.mdx`, each with a co-located `cover.jpg`. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full frontmatter schema, MDX component usage, and image-naming convention. The frontmatter schema itself is enforced by `src/content.config.ts` — an invalid or incomplete post fails the build rather than publishing silently wrong.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production site to `./dist/` (also runs the Pagefind post-build indexing step) |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Astro's type/prop checker (`astro check`) |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run test:unit` | Vitest — unit tests for build-time utilities (`src/lib/`) |
| `npm run test:e2e` | Playwright — builds, serves, and runs interaction/accessibility (axe-core) tests against every page template |

CI (`.github/workflows/ci.yml`) runs lint, format check, `astro check`, unit tests, build, E2E/accessibility tests, and a mobile-preset Lighthouse CI gate on every PR.

## Deployment

The site deploys as a single native Cloudflare Worker named `bytetech247`, live at `bytetech247.workers.dev` — **not** Cloudflare Pages (only a standalone Worker can be issued a `*.workers.dev` domain). `wrangler.toml` binds the built `dist/` folder as the Worker's static assets. See `build-spec.md` Phase 11 and `wrangler.toml` for the full deploy setup, including the KV-backed counters and OG-image route.

```sh
npm run build
npx wrangler deploy
```

## Project structure

```
src/
  components/       Shared UI components (Header, Footer, PostCard, etc.)
  components/layout/  Layout primitives (Stack, Cluster, Grid, Center)
  content/blog/      MDX posts, one folder per post
  layouts/           BaseLayout.astro — the shared <head>/<html> shell
  lib/               Build-time utilities (reading time, related posts, JSON-LD, RSS, taxonomy)
  pages/             File-based routes, including dynamic [category]/[slug] and API-style endpoints (sitemap.xml, rss.xml, llms.txt)
  styles/global.css  Design tokens + cascade-layer structure (Phase 1)
tests/
  unit/              Vitest specs for src/lib/
  e2e/               Playwright specs (interaction + accessibility)
```
