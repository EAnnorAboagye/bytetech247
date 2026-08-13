// Grammar/style check for a drafted post's prose, via LanguageTool's public
// API (languagetool.org/dev — free tier, no key required, ~20 req/min). Part
// of write-article's discipline gate (§7): run this before calling a draft
// done, the same way scripts/generate-conceptual-cover.mjs is run during
// drafting rather than wired into the Astro build. Not part of the build —
// run manually:
//   node scripts/check-grammar.mjs <post-folder>/index.mdx
//
// Reports every match LanguageTool finds; does not auto-fix anything and
// does not blindly fail the draft on any hit. Grammar tools have a real
// false-positive rate on technical writing (flagging code-adjacent jargon,
// intentional sentence fragments in a Quick Answer block, etc.) — the human/
// agent reviewing the report decides which matches are real, same judgment
// call write-article's own checklist already asks for elsewhere. Exits 1
// only to make `&&`-chaining useful; a non-zero exit here means "matches
// found to review," not "draft rejected."
import { readFileSync } from "node:fs";

const [, , filePath] = process.argv;

if (!filePath) {
  console.error(
    "Usage: node scripts/check-grammar.mjs <post-folder>/index.mdx",
  );
  process.exit(1);
}

const raw = readFileSync(filePath, "utf8");

// Strip frontmatter, fenced code blocks, inline code, and MDX component
// tags before sending anything to LanguageTool — none of that is prose, and
// flagging a CLI flag or a JSX prop as a grammar error would just be noise
// that trains the reviewer to stop reading the report.
function extractProse(mdx) {
  let body = mdx.replace(/^---\n[\s\S]*?\n---\n/, "");
  body = body.replace(/```[\s\S]*?```/g, " "); // whole fenced blocks aren't prose, safe to delete
  body = body.replace(/`([^`]*)`/g, "$1"); // inline code: keep the term, drop only the backticks — deleting it outright orphans the surrounding punctuation and breaks sentence structure
  body = body.replace(/<[^>]+>/g, " ");
  body = body.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // keep link text
  // A heading's own text isn't a sentence and shouldn't grammatically blend
  // into the paragraph that follows it — terminate it with a period so
  // LanguageTool sees a real sentence boundary instead of flagging the next
  // paragraph's first word for "missing capitalization."
  body = body.replace(/^#+\s*(.+)$/gm, "$1.");
  return body;
}

// Wrapped in a function so every exit path is a plain `return`, setting
// `process.exitCode` and letting the module finish naturally instead of
// calling `process.exit()` mid-flow — see check-originality.mjs's own
// comment on the real Windows/libuv crash that pattern caused there with a
// pending fetch-related handle. Applied here too for the same safety
// margin, not because this specific script has confirmed the crash itself.
async function main() {
  const prose = extractProse(raw);

  // LanguageTool caps request size; a full post's prose is well under this,
  // but fail loudly rather than silently truncating if that ever changes.
  if (prose.length > 19000) {
    console.error(
      `Prose is ${prose.length} chars, close to or over LanguageTool's free-tier request size limit. Check in sections if this fails.`,
    );
  }

  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      text: prose,
      language: "en-US",
      // Style-only rules (like "consider a shorter word") are enabled by
      // default; picky rules that misfire constantly on technical prose
      // (e.g. flagging every deliberate sentence fragment) are left on
      // deliberately — better to see and dismiss a false positive than to
      // silently suppress a category that would've caught a real one.
    }),
  });

  if (!response.ok) {
    console.error(
      `LanguageTool request failed: ${response.status} ${response.statusText}`,
    );
    console.error(await response.text());
    process.exitCode = 1;
    return;
  }

  const { matches } = await response.json();

  if (!matches || matches.length === 0) {
    console.log(`No issues found in ${filePath}.`);
    return;
  }

  console.log(`${matches.length} issue(s) found in ${filePath}:\n`);
  for (const m of matches) {
    const context = m.context.text;
    const pointer =
      " ".repeat(m.context.offset) + "^".repeat(Math.max(m.context.length, 1));
    const suggestions = m.replacements
      .slice(0, 3)
      .map((r) => r.value)
      .join(" / ");
    console.log(`[${m.rule.category.name}] ${m.message}`);
    console.log(`  ${context}`);
    console.log(`  ${pointer}`);
    if (suggestions) console.log(`  Suggested: ${suggestions}`);
    console.log("");
  }

  process.exitCode = 1;
}

await main();
