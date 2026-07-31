// Generates the site-wide default OG/Twitter image (1200x630, the standard
// Open Graph size) as a PNG. SVG isn't reliably rendered as a link-preview
// image by Facebook, LinkedIn, iMessage, etc., so pages without their own
// cover (home, about, category/tag pages) need a raster fallback instead of
// public/logo-mark.svg. Not part of the build — run manually:
// node scripts/make-default-og-image.mjs
//
// Rendered with @resvg/resvg-js rather than sharp: sharp's SVG rasterizer
// (librsvg) silently ignores embedded @font-face data URIs and falls back
// to a generic system font with no warning, which would ship this image
// with the wrong typeface with no build error to catch it. resvg loads a
// real local font file instead (loadSystemFonts: false), so the family
// name used below is guaranteed to be the one that's actually installed,
// not whatever the host machine happens to have.
//
// scripts/assets/fonts/*.ttf (not public/fonts/*.woff2) on purpose: resvg's
// fontdb couldn't parse the site's self-hosted woff2 files ("malformed
// font" — a table-compression edge case in that woff2 build, unrelated to
// browsers, which render them fine), so this script keeps its own TTF
// copies rather than reusing the site's webfonts. They're source-only
// assets for this manual script, not something the site should ship, so
// they live outside public/.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const outFile = "public/og-default.png";
// Kept in sync with src/config.ts siteConfig.name/description by hand —
// this script isn't part of the build, same as make-placeholder-cover.mjs.
const siteName = "ByteTech247";
const width = 1200;
const height = 630;

// Same brand colors as public/logo-mark.svg / global.css --color-accent —
// not a new palette invented for this asset.
const INK = "#0B120F";
const SIGNAL = "#14957F";
const TRACE = "#6B7D77";
const PAPER = "#F4F2ED";

const tagline = "Dev Tools, Automation &amp; AI Productivity";

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${INK}" />

  <!-- logo mark: the "lit bit" byte grid, matching logo-mark.svg -->
  <g transform="translate(90, 195) scale(1.875)">
    <rect width="128" height="128" rx="24" fill="none" stroke="${TRACE}" stroke-opacity="0.35" stroke-width="2" />
    <rect x="15" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="41" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="67" y="41" width="20" height="20" rx="4" fill="${SIGNAL}" />
    <rect x="93" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="15" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="41" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="67" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="93" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  </g>

  <text x="330" y="270" font-family="IBM Plex Mono" font-weight="700" font-size="72" letter-spacing="-2" fill="${PAPER}">${siteName}</text>
  <text x="330" y="330" font-family="IBM Plex Sans" font-weight="400" font-size="34" fill="${TRACE}">${tagline}</text>
</svg>
`;

const resvg = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontFiles: [
      "scripts/assets/fonts/plex-mono-700.ttf",
      "scripts/assets/fonts/plex-sans-400.ttf",
    ],
  },
});
const png = resvg.render().asPng();
writeFileSync(outFile, png);

console.log(`Wrote ${outFile} (${width}x${height})`);
