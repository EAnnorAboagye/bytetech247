import { execFileSync } from "node:child_process";

/**
 * build-spec.md Phase 13: freshness signal pulled from git commit
 * history rather than a manually-bumped frontmatter field — the date of
 * the most recent commit that actually touched this file. Returns null
 * if the file has no commit history yet (freshly added, uncommitted) —
 * callers should render nothing in that case, not a fallback date.
 *
 * Requires full git history to be available (CI's checkout step must
 * use fetch-depth: 0 — a shallow clone can only see whichever commits
 * it happened to fetch, silently returning null for files last touched
 * further back than that).
 */
export function getLastVerifiedDate(filePath: string): Date | null {
  try {
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%aI", "--", filePath],
      { encoding: "utf-8", cwd: process.cwd() },
    ).trim();
    return output ? new Date(output) : null;
  } catch {
    return null;
  }
}
