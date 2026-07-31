// Generates public/apple-touch-icon.png (180x180) — iOS requires an opaque
// raster icon for home-screen bookmarks; it ignores SVG favicons entirely
// and applies its own corner-rounding mask, so this is a flat-background
// square, not a copy of favicon.svg's rounded rect. Not part of the build —
// run manually: node scripts/make-apple-touch-icon.mjs
import sharp from "sharp";

const outFile = "public/apple-touch-icon.png";
const size = 180;

// Same brand colors as public/logo-mark.svg — the "lit bit" mark, pure
// geometry, so no font dependency here (contrast with make-default-og-image.mjs,
// which does need real text and therefore real embedded fonts).
const INK = "#0B120F";
const SIGNAL = "#14957F";
const TRACE = "#6B7D77";

// Same 128-unit grid as logo-mark.svg; viewBox scales to the 180px output
// automatically, so the coordinates below don't need re-deriving by hand.
const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="${INK}" />
  <rect x="15" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  <rect x="41" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  <rect x="67" y="41" width="20" height="20" rx="4" fill="${SIGNAL}" />
  <rect x="93" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  <rect x="15" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  <rect x="41" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  <rect x="67" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  <rect x="93" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(outFile);

console.log(`Wrote ${outFile} (${size}x${size})`);
