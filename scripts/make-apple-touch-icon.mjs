// Generates public/apple-touch-icon.png (180x180) — iOS requires an opaque
// raster icon for home-screen bookmarks; it ignores SVG favicons entirely
// and applies its own corner-rounding mask, so this is a solid-background
// square, not a copy of favicon.svg's rounded rect. Not part of the build —
// run manually: node scripts/make-apple-touch-icon.mjs
import sharp from "sharp";

const outFile = "public/apple-touch-icon.png";
const size = 180;

// Same brand colors as public/logo-mark.svg / favicon.svg.
const TEAL = "#0D9488";
const AMBER = "#F59E0B";

const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${TEAL}" />
  <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
    font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="700"
    font-size="76" fill="#FFFFFF">&lt;/&gt;</text>
  <circle cx="138" cy="138" r="16" fill="${AMBER}" stroke="${TEAL}" stroke-width="5" />
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(outFile);

console.log(`Wrote ${outFile} (${size}x${size})`);
