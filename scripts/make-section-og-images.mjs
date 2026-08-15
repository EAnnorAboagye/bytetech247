// Per-section OG/Twitter images (1200x630) for the pages that used to all
// share the single site-wide public/og-default.png fallback: the four
// category archives, the /tools/ index, and /about/. Same rendering
// approach as make-default-og-image.mjs (resvg, not sharp — see that
// script's own comment for why), same brand palette, just parameterized by
// section instead of hardcoded to the site-wide identity. Not part of the
// build — run manually: node scripts/make-section-og-images.mjs
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";

const width = 1200;
const height = 630;

const INK = "#0B120F";
const TRACE = "#6B7D77";
const PAPER = "#F4F2ED";

// Hex approximations of the same OKLCH hues global.css uses for each
// category's --category-accent-* token (light-mode lightness/chroma) — an
// OG image is a flat raster export, not a themed page, so an exact oklch()
// match isn't the point; staying in the same hue family so a category's
// social-preview color agrees with its on-site accent is.
const SECTIONS = [
  {
    slug: "dev-tools",
    label: "Dev Tools",
    tagline: "Editors, CLIs, and Git workflows, covered hands-on.",
    accent: "#3E7CB8",
  },
  {
    slug: "data-automation",
    label: "Data & Automation",
    tagline: "CI/CD, deploy pipelines, and scripts that remove a manual step.",
    accent: "#6462C9",
  },
  {
    slug: "ai-productivity",
    label: "AI Productivity",
    tagline: "Using AI coding assistants well: prompting, review, real limits.",
    accent: "#A64C97",
  },
  {
    slug: "guides-fixes",
    label: "Guides & Fixes",
    tagline:
      "The specific bug, the specific error, the fix that actually works.",
    accent: "#BE6A2E",
  },
  {
    slug: "tools",
    label: "Tools",
    tagline: "Free, client-side utilities. No sign-up, no server round-trip.",
    accent: "#14957F",
    out: "og-tools.png",
  },
  {
    slug: "about",
    label: "About ByteTech247",
    tagline: "Every post exists to solve one real, specific problem.",
    accent: "#14957F",
    out: "og-about.png",
  },
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

for (const section of SECTIONS) {
  const outFile = `public/${section.out ?? `og-${section.slug}.png`}`;
  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${INK}" />
  <rect x="0" y="0" width="14" height="${height}" fill="${section.accent}" />

  <!-- small wordmark, top-left, same byte-grid mark as og-default -->
  <g transform="translate(90, 82) scale(0.75)">
    <rect width="128" height="128" rx="24" fill="none" stroke="${TRACE}" stroke-opacity="0.35" stroke-width="2" />
    <rect x="15" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="41" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="67" y="41" width="20" height="20" rx="4" fill="${section.accent}" />
    <rect x="93" y="41" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="15" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="41" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="67" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
    <rect x="93" y="67" width="20" height="20" rx="4" fill="none" stroke="${TRACE}" stroke-opacity="0.55" stroke-width="2" />
  </g>
  <text x="196" y="122" font-family="IBM Plex Mono" font-weight="700" font-size="28" letter-spacing="-1" fill="${TRACE}">ByteTech247</text>

  <text x="90" y="330" font-family="IBM Plex Mono" font-weight="700" font-size="76" letter-spacing="-2" fill="${PAPER}">${escapeXml(section.label)}</text>
  <text x="90" y="392" font-family="IBM Plex Sans" font-weight="400" font-size="30" fill="${TRACE}">${escapeXml(section.tagline)}</text>
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
  mkdirSync("public", { recursive: true });
  writeFileSync(outFile, resvg.render().asPng());
  console.log(`Wrote ${outFile} (${width}x${height})`);
}
