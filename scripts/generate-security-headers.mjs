// Appends security headers to dist/_headers as a postbuild step (run after
// `astro build`, which has already copied public/_headers into dist/_headers
// verbatim). Content-Security-Policy's script-src can't be hardcoded in
// public/_headers because it allowlists this build's inline <script> blocks
// by content hash rather than 'unsafe-inline' — CSP hashes are exact SHA-256
// digests of each script's own text, so they have to be computed from the
// real build output every time, not maintained by hand (Lighthouse mobile
// audit, 2026-08-05: "No CSP found in enforcement mode", "No HSTS header
// found", "No COOP header found", "No frame control policy found" — all
// High severity).
import { readFileSync, readdirSync, appendFileSync } from "node:fs";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname — a file:// URL's .pathname keeps a leading
// "/" (e.g. "/C:/Users/.../dist/" on Windows), which readdirSync doesn't
// treat as the drive-rooted path it looks like: Windows resolves a
// leading-slash path against the *current* drive, so "/C:/Users/..." became
// a literal "C:\C:\Users\..." lookup and crashed every local Windows build.
// fileURLToPath does the platform-correct file://-to-OS-path conversion.
const DIST_DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const HEADERS_FILE = join(DIST_DIR, "_headers");

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtmlFiles(full));
    else if (extname(entry.name) === ".html") out.push(full);
  }
  return out;
}

// Regex-based, not a full HTML parser — strip comments first so a doc
// comment that happens to *mention* "<script ...>" (e.g. this repo's own
// BaseLayout.astro gtag comment) can't be mistaken for a real tag and
// swallow everything up to the next real </script>.
function extractInlineScripts(html) {
  const stripped = html.replace(/<!--[\s\S]*?-->/g, "");
  const scripts = [];
  const tagRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = tagRe.exec(stripped))) {
    const [, attrs, body] = match;
    if (/\bsrc\s*=/i.test(attrs)) continue; // externally loaded, governed by host allowlist
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue; // data, not executable
    // Not trimmed: a CSP hash source covers the script element's exact
    // text content, whitespace included — confirmed live, a trimmed hash
    // here didn't match what the browser computed and every inline
    // script on the site was refused.
    if (body.trim()) scripts.push(body);
  }
  return scripts;
}

const htmlFiles = walkHtmlFiles(DIST_DIR);
const scriptHashes = new Set();
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const script of extractInlineScripts(html)) {
    const digest = createHash("sha256").update(script, "utf8").digest("base64");
    scriptHashes.add(`'sha256-${digest}'`);
  }
}

if (scriptHashes.size === 0) {
  throw new Error(
    "generate-security-headers: found 0 inline <script> blocks across " +
      `${htmlFiles.length} HTML files — the extraction regex likely broke ` +
      "against a build output change. Refusing to ship a CSP that would " +
      "block every inline script on the site.",
  );
}

// Cloudflare's dashboard-level Web Analytics is on Automatic Setup for this
// zone — confirmed live (2026-08-05): the console showed a beacon.min.js
// load *and two inline bootstrap scripts* being CSP-blocked on production,
// none of which exist anywhere in this repo or in dist/. Cloudflare's edge
// rewrites every HTML response to inject them after our build already ran,
// so no build-time scan can ever see or hash them — the two hashes below
// are hardcoded from that live violation report instead (Chrome's CSP
// error conveniently reports the exact hash it needed). This is inherently
// coupled to Cloudflare's current injected snippet: if Cloudflare ever
// changes it, these two go stale and Web Analytics silently stops loading
// (CSP-blocked) without breaking anything else. If that happens, the fix
// is the same as this one — read the new expected hash(es) straight out of
// the browser console's CSP violation message and swap them in here. The
// robust alternative (self-host the beacon tag instead of Automatic Setup,
// so it's an ordinary same-repo inline script this file can hash normally)
// requires the zone's beacon token from the Cloudflare dashboard, which
// isn't available from inside this build.
const CLOUDFLARE_BEACON_INLINE_HASHES = [
  `'sha256-sWBR1cu1LmFs85q0DMGYfiesZEzA7oTOPNOvWSXlHpU='`,
  `'sha256-y67cZoAbI8wNKXC4i8Hl9+xyDj013fPXFMzRcQaSF7E='`,
];

// gtag.js is fetched by our own inline bootstrap script (BaseLayout.astro)
// only after the window "load" event, then reports to Google's collection
// endpoints — both need an explicit allowlist entry since neither is
// same-origin.
const csp = [
  `default-src 'self'`,
  // 'wasm-unsafe-eval' — Pagefind's search index runs as a WebAssembly
  // module (confirmed live: without this, WebAssembly.instantiate() itself
  // is refused). It's the CSP Level 3 keyword scoped narrowly to compiling
  // WASM, not general script eval — 'unsafe-eval' would additionally allow
  // eval()/Function()/string-arg setTimeout, which nothing on this site
  // needs or should have.
  `script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com ${CLOUDFLARE_BEACON_INLINE_HASHES.join(" ")} ${[...scriptHashes].sort().join(" ")}`,
  `style-src 'self' 'unsafe-inline'`, // Shiki emits a `style=""` per syntax-highlighted token; hashing each is infeasible
  `img-src 'self'`,
  `font-src 'self'`,
  `connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `require-trusted-types-for 'script'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeadersBlock = `
# Generated by scripts/generate-security-headers.mjs — do not hand-edit the
# Content-Security-Policy line, it embeds this build's inline-script hashes.
/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
`;

appendFileSync(HEADERS_FILE, securityHeadersBlock);

console.log(
  `generate-security-headers: wrote CSP with ${scriptHashes.size} script hash(es) ` +
    `from ${htmlFiles.length} HTML files to dist/_headers`,
);
