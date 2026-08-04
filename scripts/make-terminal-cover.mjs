// Generates a 1600x900 "terminal window" cover image from real, already-
// captured command output — for guides-fixes posts diagnosing a specific
// error. Not part of the build — run manually:
//   node scripts/make-terminal-cover.mjs <outfile> <config.json>
//
// config.json shape:
// {
//   "titlebarLabel": "npm install - astro@7 project",
//   "lines": [
//     { "text": "$ npm install", "tone": "prompt" },
//     { "text": "", "tone": "plain" },
//     { "text": "npm error code ERESOLVE", "tone": "error" },
//     { "text": "npm error   node_modules/vite", "tone": "dim" }
//   ]
// }
//
// tone is one of: prompt | error | dim | plain | accent — see TONES below.
// `text` must be the real captured output (or a deliberately trimmed
// excerpt, noted as such in the post body) — never invented text. This
// mirrors the write-article/guides-fixes-article rule that a cover image
// is content, not decoration, and must not misrepresent what the post
// verified.
//
// Rendered with @resvg/resvg-js (see scripts/make-default-og-image.mjs for
// why, not sharp) with loadSystemFonts: true — unlike the sitewide OG
// image, a single post's cover isn't a brand-critical asset shipped on
// every page, so pinning an exact local font file isn't worth the extra
// setup here. Colors match make-default-og-image.mjs's palette so every
// generated asset on the site reads as one system.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const [, , outFile, configPath] = process.argv;

if (!outFile || !configPath) {
  console.error(
    "Usage: node scripts/make-terminal-cover.mjs <outfile> <config.json>",
  );
  process.exit(1);
}

const width = 1600;
const height = 900;

// Same brand colors as scripts/make-default-og-image.mjs — keep these two
// files in sync if the palette ever changes.
const INK = "#0B120F";
const SIGNAL = "#14957F";
const TRACE = "#6B7D77";
const PAPER = "#F4F2ED";
const ERROR_RED = "#E5484D";
const TITLEBAR = "#131C18";

const TONES = {
  prompt: SIGNAL,
  error: ERROR_RED,
  dim: TRACE,
  plain: PAPER,
  accent: SIGNAL,
};

const config = JSON.parse(readFileSync(configPath, "utf8"));
const { titlebarLabel, lines } = config;

if (!titlebarLabel || !Array.isArray(lines) || lines.length === 0) {
  console.error(
    "config.json must have a non-empty titlebarLabel and a non-empty lines array",
  );
  process.exit(1);
}

const lineHeight = 42;
const startY = 210;
const textRows = lines
  .map((line, i) => {
    const y = startY + i * lineHeight;
    const color = TONES[line.tone] ?? PAPER;
    const escaped = String(line.text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<text x="96" y="${y}" font-family="Consolas, monospace" font-size="25" fill="${color}" xml:space="preserve">${escaped}</text>`;
  })
  .join("\n  ");

const escapedTitlebar = String(titlebarLabel)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${INK}" />
  <rect x="80" y="80" width="${width - 160}" height="${height - 160}" rx="16" fill="${TITLEBAR}" stroke="${TRACE}" stroke-opacity="0.35" stroke-width="2" />
  <rect x="80" y="80" width="${width - 160}" height="68" rx="16" fill="${TITLEBAR}" />
  <rect x="80" y="132" width="${width - 160}" height="16" fill="${TITLEBAR}" />
  <circle cx="120" cy="114" r="9" fill="#FF5F56" />
  <circle cx="150" cy="114" r="9" fill="#FFBD2E" />
  <circle cx="180" cy="114" r="9" fill="#27C93F" />
  <text x="212" y="121" font-family="Consolas, monospace" font-size="22" fill="${TRACE}">${escapedTitlebar}</text>
  ${textRows}
</svg>
`;

const resvg = new Resvg(svg, {
  font: { loadSystemFonts: true },
});
const png = resvg.render().asPng();
writeFileSync(outFile, png);

console.log(`Wrote ${outFile} (${width}x${height})`);
