// Generates a compliant 16:9 placeholder cover image (>=1600x900) for draft
// posts that don't have real photography yet. Not part of the build —
// run manually: node scripts/make-placeholder-cover.mjs <outfile> ["Label"]
import sharp from "sharp";

const [, , outFile, label = "ByteTech247"] = process.argv;

if (!outFile) {
  console.error(
    "Usage: node scripts/make-placeholder-cover.mjs <outfile> [label]",
  );
  process.exit(1);
}

const width = 1600;
const height = 900;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12171b" />
      <stop offset="100%" stop-color="#2251c6" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
    font-family="sans-serif" font-size="64" font-weight="700" fill="#f4fbff">
    ${label}
  </text>
</svg>
`;

await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(outFile);

console.log(`Wrote ${outFile} (${width}x${height})`);
