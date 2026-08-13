const DEFAULT_MAX_LENGTH = 60;

/**
 * Composes a page's rendered <title> (also reused verbatim for og:title/
 * twitter:title in BaseLayout.astro) from a base title plus an optional
 * " — suffix". src/content.config.ts caps a post's raw title at 60 chars
 * specifically so Google doesn't truncate it in search snippets — but that
 * schema check only ever sees the raw title, not the final string a
 * template renders once a category/site suffix is appended, so a title
 * that's valid on its own could still push the actual <title> tag past the
 * same budget it was capped to respect. Dropping the suffix once the
 * combination would exceed maxLength keeps the real, truncatable string
 * in-budget without forcing every post's title shorter than it needs to be
 * standalone.
 */
export function pageTitle(
  base: string,
  suffix?: string,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  if (!suffix) return base;
  const combined = `${base} — ${suffix}`;
  return combined.length <= maxLength ? combined : base;
}
