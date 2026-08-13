// Originality check: flags any long run of words shared verbatim between a
// draft's own prose and the pages it cites. Part of write-article's
// discipline gate (§7) — this site drafts from primary sources (official
// docs, changelogs, GitHub issues) by design, so the real risk isn't broad
// web plagiarism, it's prose that ends up too close to the source's own
// sentence structure when summarizing it. Not part of the build — run
// manually:
//   node scripts/check-originality.mjs <post-folder>/index.mdx
//
// Deliberately excludes blockquotes and code — this site's own citation
// discipline calls for genuinely verbatim quotes (an exact error string, an
// exact changelog line) in those two places specifically, and flagging an
// intentional quote as a false "plagiarism" hit would just train the
// reviewer to ignore the report. Only prose paragraphs, the part that's
// supposed to be the author's own explanation, gets checked.
import { readFileSync } from "node:fs";

const [, , filePath] = process.argv;

if (!filePath) {
  console.error(
    "Usage: node scripts/check-originality.mjs <post-folder>/index.mdx",
  );
  process.exit(1);
}

const NGRAM_SIZE = 8; // 8 consecutive words shared verbatim is well past
// coincidental overlap for ordinary prose describing the same fact.

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ngrams(text, n) {
  const words = normalize(text).split(" ").filter(Boolean);
  const grams = new Set();
  for (let i = 0; i + n <= words.length; i++) {
    grams.add(words.slice(i, i + n).join(" "));
  }
  return grams;
}

function extractDraftProse(mdx) {
  let body = mdx.replace(/^---\n[\s\S]*?\n---\n/, "");
  body = body.replace(/```[\s\S]*?```/g, " "); // fenced code
  body = body.replace(/`([^`]*)`/g, "$1"); // inline code: keep the term, drop only the backticks
  body = body.replace(/^>.*$/gm, " "); // blockquotes — intentional verbatim quotes
  body = body.replace(/<[^>]+>/g, " "); // JSX/HTML tags
  body = body.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // keep link text only
  return body;
}

function extractCitedUrls(mdx) {
  const bodyStart = mdx.indexOf("\n---\n", 4) + 5;
  const body = mdx.slice(bodyStart);
  const md = [...body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(
    (m) => m[2],
  );
  const html = [...body.matchAll(/<a\s+href="(https?:\/\/[^"]+)"/g)].map(
    (m) => m[1],
  );
  return [...new Set([...md, ...html])].filter(
    (url) => !url.includes("bytetech247.com"),
  );
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Wrapped in a function (rather than left as top-level control flow) so
// every exit path is a plain `return` — setting `process.exitCode` and
// letting the module finish naturally, instead of calling `process.exit()`
// while a fetch's AbortSignal.timeout() handle may still be mid-cleanup.
// Confirmed live: an immediate process.exit() there crashes with a libuv
// "UV_HANDLE_CLOSING" assertion on Windows even after printing correct
// output — a real bug, not a hypothetical one.
async function main() {
  const raw = readFileSync(filePath, "utf8");
  const draftProse = extractDraftProse(raw);
  const draftGrams = ngrams(draftProse, NGRAM_SIZE);
  const citedUrls = extractCitedUrls(raw);

  if (draftGrams.size === 0) {
    console.log("No prose extracted from draft — nothing to check.");
    return;
  }

  if (citedUrls.length === 0) {
    console.log(
      "No external citations found in this post — nothing to check against.",
    );
    return;
  }

  let totalOverlaps = 0;

  for (const url of citedUrls) {
    let sourceText;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ByteTech247-originality-check/1.0)",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        console.log(`SKIP (HTTP ${res.status}): ${url}`);
        continue;
      }
      sourceText = stripHtml(await res.text());
    } catch (err) {
      console.log(`SKIP (fetch failed: ${err.message}): ${url}`);
      continue;
    }

    const sourceGrams = ngrams(sourceText, NGRAM_SIZE);
    const overlaps = [...draftGrams].filter((g) => sourceGrams.has(g));

    if (overlaps.length > 0) {
      totalOverlaps += overlaps.length;
      console.log(`\nOverlap with ${url}:`);
      for (const phrase of overlaps) {
        console.log(`  "${phrase}"`);
      }
    }
  }

  if (totalOverlaps === 0) {
    console.log(
      `\nNo ${NGRAM_SIZE}+ word verbatim overlaps found. Prose reads as original relative to its own citations.`,
    );
    return;
  }

  console.log(
    `\n${totalOverlaps} overlapping phrase(s) found. Review each: a real one needs rewording or moving into an explicit blockquote as an intentional quote.`,
  );
  process.exitCode = 1;
}

await main();
