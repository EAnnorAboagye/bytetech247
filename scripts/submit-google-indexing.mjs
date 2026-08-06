// Pings Google's Indexing API with every URL in the just-built sitemap —
// the Google-side counterpart to scripts/submit-indexnow.mjs, which
// explicitly does NOT reach Google (IndexNow's participants are Bing,
// Yandex, and a few others; Google has never adopted that protocol).
//
// Google only documents this API for JobPosting/BroadcastEvent pages, but
// it's widely used in practice for ordinary content and generally works —
// that's a real caveat, not a guarantee, so a failure here is logged and
// non-fatal (same posture as submit-indexnow.mjs), never a broken deploy.
//
// Auth is a Google service-account JWT flow (RS256-signed JWT -> exchanged
// for a bearer token at Google's OAuth endpoint), hand-rolled in
// scripts/lib/google-service-account.mjs with Node's built-in crypto
// rather than pulling in google-auth-library/googleapis — the whole flow
// is two fetches and one signature, not worth a dependency for that. That
// helper is shared with scripts/check-index-status.mjs, which requests a
// different scope against the same service account. Requires the service
// account to be added as an Owner on this property in Search Console
// (Settings -> Users and permissions) — the API call fails with a
// permissions error otherwise, not a silent no-op.
//
// Reads the full downloaded service-account JSON key from
// GOOGLE_INDEXING_SERVICE_ACCOUNT (the whole file's contents as one
// secret, not split into separate vars) — keeps the PEM private key's
// newlines intact without escaping headaches. Never commit that file or
// print its contents.
//
// Run from CI, after a successful `wrangler deploy` (see
// .github/workflows/ci.yml), same point as the IndexNow submission. Can
// also be run manually: GOOGLE_INDEXING_SERVICE_ACCOUNT="$(cat key.json)" node scripts/submit-google-indexing.mjs
import { readFileSync } from "node:fs";
import {
  loadServiceAccountCredentials,
  getAccessToken,
} from "./lib/google-service-account.mjs";

const INDEXING_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";

const credentials = loadServiceAccountCredentials();

if (!credentials) {
  console.log(
    "GOOGLE_INDEXING_SERVICE_ACCOUNT not set — skipping Google Indexing API submission. " +
      "See scripts/submit-google-indexing.mjs for setup.",
  );
  process.exit(0);
}

// Confirmed live (2026-08-05): submitting every sitemap URL on every deploy
// blew through the API's 200/day publish-request quota after a handful of
// same-day deploys — 31 of 39 URLs came back 429 RESOURCE_EXHAUSTED on one
// run. The sitemap already carries an accurate <lastmod> per URL (see
// src/pages/sitemap.xml.ts), so only resubmit what's actually new or
// recently changed instead of the whole site every time. A URL with no
// <lastmod> (shouldn't happen for posts, possible for a static page whose
// git history lookup came back empty) is submitted rather than silently
// skipped forever.
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

try {
  const accessToken = await getAccessToken(credentials, SCOPE);
  let succeeded = 0;

  for (const url of urlList) {
    const response = await fetch(INDEXING_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });
    if (response.ok) {
      succeeded += 1;
    } else {
      console.error(
        `Google Indexing API: ${url} -> ${response.status} ${await response.text()}`,
      );
    }
  }

  console.log(
    `Google Indexing API: submitted ${succeeded}/${urlList.length} URLs`,
  );
} catch (error) {
  // Same posture as submit-indexnow.mjs: a failed push is a missed SEO
  // nicety, not a broken deploy — log it and let CI continue.
  console.error(
    "Google Indexing API submission failed (non-fatal):",
    error.message,
  );
}
