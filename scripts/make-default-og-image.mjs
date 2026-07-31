// Generates the site-wide default OG/Twitter image (1200x630, the standard
// Open Graph size) as a PNG. SVG isn't reliably rendered as a link-preview
// image by Facebook, LinkedIn, iMessage, etc., so pages without their own
// cover (home, about, category/tag pages) need a raster fallback instead of
// public/logo-mark.svg. Not part of the build — run manually:
// node scripts/make-default-og-image.mjs
import sharp from "sharp";

const outFile = "public/og-default.png";
// Kept in sync with src/config.ts siteConfig.name by hand — this script
// isn't part of the build, same as make-placeholder-cover.mjs.
const siteName = "ByteTech247";
const width = 1200;
const height = 630;

// Same brand colors as public/logo-mark.svg / logo-full.svg — not a new
// palette invented for this asset.
const TEAL = "#0D9488";
const AMBER = "#F59E0B";
const NAVY = "#0F172A";

const tagline = "Dev Tools, Automation &amp; AI Productivity";

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY}" />
      <stop offset="100%" stop-color="${TEAL}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />

  <!-- logo mark: rounded square + </> + amber dot, matching logo-mark.svg -->
  <g transform="translate(90, 195)">
    <rect width="120" height="120" rx="22" fill="${TEAL}" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="2" />
    <text x="60" y="79" text-anchor="middle" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="52" fill="#FFFFFF">&lt;/&gt;</text>
    <circle cx="92" cy="92" r="12" fill="${AMBER}" stroke="${TEAL}" stroke-width="4" />
  </g>

  <text x="250" y="270" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="72" fill="#FFFFFF">${siteName}</text>
  <text x="250" y="330" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="500" font-size="34" fill="#E2F5F2">${tagline}</text>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(outFile);

console.log(`Wrote ${outFile} (${width}x${height})`);
