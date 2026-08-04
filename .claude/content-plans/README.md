# Content plans

Persisted output of the [`pillar-cluster`](../skills/pillar-cluster/SKILL.md) skill — one file per category, named `<category-slug>.md` (e.g. `guides-fixes.md`). These are planning artifacts, not site content: nothing here is read by Astro or built into the site, so this directory stays out of `src/content/blog`.

Each file holds a Pillar + 5 Clusters for that category. Every entry carries a **Status**:

- `pending` — researched by `pillar-cluster`, not yet reviewed.
- `approved` — the user greenlit this topic for drafting.
- `written` — the MDX file exists in `src/content/blog` (Slug is filled in).

`pillar-cluster` creates and updates these files (merging in new research, never overwriting `approved`/`written` entries). The category-specific writing skill (e.g. `guides-fixes-article`) flips an entry to `written` once its MDX file actually exists. This is what lets a category's batch — "write every approved cluster" — resume correctly across sessions instead of relying on chat history.
