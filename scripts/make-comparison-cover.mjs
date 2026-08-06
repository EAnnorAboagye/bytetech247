// Generates a 1600x900 "comparison matrix" cover image for a post whose
// whole premise is a Structural Comparison Matrix table with no single
// dominant terminal/payload artifact to show instead (dev-tools-article,
// data-automation-article, and ai-productivity-article §10 all specify
// this as the fallback cover shape for exactly that case). Not built until
// now because no single post needed it — three pillar hub pages needing
// this same shape at once is what crosses that skill's own "a second post
// needs this shape" threshold for committing a script rather than a
// one-off. Not part of the build — run manually:
//   node scripts/make-comparison-cover.mjs <outfile> <config.json>
//
// config.json shape:
// {
//   "title": "Wrangler's July 2026 Breaking Changes",
//   "badge": "10 changes, wrangler@4.111-4.119",
//   "rows": ["Service environments removed", "toml vs jsonc precedence", ...]
// }
//
// `rows` must be the real row labels already verified in the post's own
// Structural Comparison Matrix table — never invented categories, same
// anti-fabrication rule as the terminal cover script's `text` field.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const [, , outFile, configPath] = process.argv;

if (!outFile || !configPath) {
  console.error(
    "Usage: node scripts/make-comparison-cover.mjs <outfile> <config.json>",
  );
  process.exit(1);
}

const width = 1600;
const height = 900;

// Same brand colors as make-terminal-cover.mjs / make-default-og-image.mjs.
const INK = "#0B120F";
const SIGNAL = "#14957F";
const TRACE = "#6B7D77";
const PAPER = "#F4F2ED";
const PANEL = "#131C18";

const config = JSON.parse(readFileSync(configPath, "utf8"));
const { title, badge, rows } = config;

if (!title || !Array.isArray(rows) || rows.length === 0) {
  console.error("config.json must have a non-empty title and rows array");
  process.exit(1);
}

function escape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Naive word-wrap for the title at ~26 chars/line at this font size —
// good enough for the short, punchy titles this site's titles already are
// (60-char cap enforced elsewhere), never more than 2 lines in practice.
function wrapTitle(text, maxChars = 26) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const titleLines = wrapTitle(title);
const titleStartY = 220;
const titleLineHeight = 62;
const titleSvg = titleLines
  .map(
    (line, i) =>
      `<text x="96" y="${titleStartY + i * titleLineHeight}" font-family="Consolas, monospace" font-size="52" font-weight="700" fill="${PAPER}">${escape(line)}</text>`,
  )
  .join("\n  ");

const rowsStartY =
  titleStartY + titleLines.length * titleLineHeight + (badge ? 70 : 40);
const rowHeight = 46;
const rowsSvg = rows
  .map((row, i) => {
    const y = rowsStartY + i * rowHeight;
    return `
  <circle cx="104" cy="${y - 9}" r="6" fill="${SIGNAL}" />
  <text x="128" y="${y}" font-family="Consolas, monospace" font-size="25" fill="${PAPER}">${escape(row)}</text>`;
  })
  .join("");

const badgeSvg = badge
  ? `<text x="96" y="${titleStartY + titleLines.length * titleLineHeight + 34}" font-family="Consolas, monospace" font-size="24" fill="${SIGNAL}">${escape(badge)}</text>`
  : "";

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${INK}" />
  <rect x="80" y="80" width="${width - 160}" height="${height - 160}" rx="16" fill="${PANEL}" stroke="${TRACE}" stroke-opacity="0.35" stroke-width="2" />
  ${titleSvg}
  ${badgeSvg}
  ${rowsSvg}
</svg>
`;

const resvg = new Resvg(svg, {
  font: { loadSystemFonts: true },
});
const png = resvg.render().asPng();
writeFileSync(outFile, png);

console.log(`Wrote ${outFile} (${width}x${height})`);
