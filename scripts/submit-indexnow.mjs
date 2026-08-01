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

const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.error("No URLs found in dist/sitemap.xml — nothing to submit.");
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
