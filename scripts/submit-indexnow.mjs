// Pings IndexNow (Bing/Yandex) with every URL in the just-built sitemap, so
// they pick up new/changed posts without waiting for their own crawl
// schedule. Does NOT reach Google — that's the separate, already-completed
// Search Console verification + sitemap submission.
//
// Run from CI, after a successful `wrangler deploy` (see .github/workflows/ci.yml)
// — never as a live route on the site itself. IndexNow's whole verification
// model is "whoever can host a file at this URL controls the domain," so the
// key is not a secret: it's committed as public/<key>.txt, the exact value
// IndexNow fetches back to confirm the ping is legitimate.
//
// Not part of the build — can also be run manually:
// node scripts/submit-indexnow.mjs
import { readFileSync } from "node:fs";

const INDEXNOW_KEY = "36bbb4da9a59b608a7cf12feeb444a04";
const SITE_URL = "https://bytetech247.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// IndexNow's single bulk POST isn't subject to Google Indexing API's
// documented per-day quota (see the same fix in submit-google-indexing.mjs,
// prompted by that quota actually being hit), but the engines do apply
// their own server-side rate limiting and quality scoring on submission
// volume, so keep this consistent with the same recent-URLs-only filter
// rather than resubmitting the whole site on every deploy. A URL with no
// <lastmod> is submitted rather than silently skipped forever.
const RECENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const now = Date.now();
const urlList = [
  ...sitemap.matchAll(
    /<url>\s*<loc>(.*?)<\/loc>(?:\s*<lastmod>(.*?)<\/lastmod>)?\s*<\/url>/g,
  ),
]
  .filter(
    ([, , lastmod]) =>
      !lastmod || now - new Date(lastmod).getTime() <= RECENT_WINDOW_MS,
  )
  .map(([, loc]) => loc);

if (urlList.length === 0) {
  console.error(
    "No recent URLs found in dist/sitemap.xml — nothing to submit.",
  );
  process.exit(0);
}

const host = new URL(SITE_URL).host;

try {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  console.log(
    `IndexNow: submitted ${urlList.length} URLs, status ${response.status}`,
  );
} catch (error) {
  // A failed ping is a missed SEO nicety, not a broken deploy — log it and
  // let CI continue rather than failing the job over a third-party outage.
  console.error("IndexNow submission failed (non-fatal):", error.message);
}
