// Checks real Google crawl/index status per URL via the Search Console
// URL Inspection API — the programmatic version of Search Console's own
// "URL Inspection" tool, and the only source of truth for "did Google
// actually crawl and index this page." scripts/submit-google-indexing.mjs
// only confirms Google *received* a push notification; it has no way of
// reporting whether Google acted on it.
//
// Endpoint/response shape confirmed against Google's own discovery
// document (searchconsole.googleapis.com/$discovery/rest?version=v1),
// not guessed: POST .../v1/urlInspection/index:inspect with
// { inspectionUrl, siteUrl }, returning inspectionResult.indexStatusResult
// = { verdict, coverageState, robotsTxtState, indexingState,
// lastCrawlTime, pageFetchState, googleCanonical, userCanonical }.
//
// Auth reuses the same GOOGLE_INDEXING_SERVICE_ACCOUNT credential and JWT
// flow as submit-google-indexing.mjs (see scripts/lib/google-service-account.mjs)
// — same service account, different OAuth scope. This works without any
// new grant because that account already has to be added as an Owner on
// the Search Console property for the Indexing API to work at all; this
// just requests a token scoped for read access to that property's
// inspection data instead of write access to indexing. Also requires the
// Search Console API enabled in the same Google Cloud project as the
// Indexing API (confirmed done 2026-08-06).
//
// GSC_SITE_URL must match the property exactly as Search Console defines
// it — a domain property is "sc-domain:bytetech247.com", a URL-prefix
// property is "https://bytetech247.com/" (trailing slash required).
// Deliberately not guessed here: submitting the wrong format returns a
// clear permission/not-found error rather than silently checking nothing,
// so check the property type in the Search Console property switcher
// rather than assume one.
//
// Not part of CI/deploy — a URL deployed minutes ago won't show as
// indexed yet regardless of what this reports, so running it immediately
// after a deploy mostly just confirms Google can see the URL at all.
// Run manually, hours to days later, to see what actually landed:
//   GOOGLE_INDEXING_SERVICE_ACCOUNT="$(cat key.json)" GSC_SITE_URL="sc-domain:bytetech247.com" node scripts/check-index-status.mjs
//   GOOGLE_INDEXING_SERVICE_ACCOUNT="$(cat key.json)" GSC_SITE_URL="sc-domain:bytetech247.com" node scripts/check-index-status.mjs https://bytetech247.com/dev-tools/some-post/
//
// Quota: 2,000 inspections/day, 600/minute per property (Search Console
// API usage limits) — nowhere close to a concern at this site's URL
// count, so no throttling here.
import {
  loadServiceAccountCredentials,
  getAccessToken,
} from "./lib/google-service-account.mjs";

const INSPECT_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SITEMAP_URL = "https://bytetech247.com/sitemap.xml";

const credentials = loadServiceAccountCredentials();
if (!credentials) {
  console.log(
    "GOOGLE_INDEXING_SERVICE_ACCOUNT not set — skipping index status check. " +
      "See scripts/check-index-status.mjs for setup.",
  );
  process.exit(0);
}

const siteUrl = process.env.GSC_SITE_URL;
if (!siteUrl) {
  console.error(
    "GSC_SITE_URL not set. Check the property switcher in Search Console for " +
      'the exact value: a domain property is "sc-domain:bytetech247.com", ' +
      'a URL-prefix property is "https://bytetech247.com/" (trailing slash required).',
  );
  process.exit(1);
}

async function urlsFromArgsOrSitemap() {
  const argUrls = process.argv.slice(2);
  if (argUrls.length > 0) return argUrls;

  const response = await fetch(SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SITEMAP_URL}: ${response.status}`);
  }
  const sitemap = await response.text();
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, loc]) => loc);
}

async function inspectUrl(accessToken, inspectionUrl) {
  const response = await fetch(INSPECT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(body)}`);
  }
  return body.inspectionResult.indexStatusResult;
}

try {
  const accessToken = await getAccessToken(credentials, SCOPE);
  const urls = await urlsFromArgsOrSitemap();

  let indexed = 0;
  let notIndexed = 0;

  for (const url of urls) {
    try {
      const result = await inspectUrl(accessToken, url);
      const isIndexed =
        result.verdict === "PASS" ||
        result.coverageState === "Submitted and indexed";
      if (isIndexed) {
        indexed++;
      } else {
        notIndexed++;
      }

      console.log(
        `${isIndexed ? "[INDEXED]" : "[PENDING]"} ${url}\n` +
          `  verdict=${result.verdict} coverage=${result.coverageState ?? "n/a"}\n` +
          `  lastCrawlTime=${result.lastCrawlTime ?? "never crawled"} pageFetch=${result.pageFetchState ?? "n/a"} robotsTxt=${result.robotsTxtState ?? "n/a"} indexing=${result.indexingState ?? "n/a"}`,
      );
    } catch (error) {
      notIndexed++;
      console.error(`[ERROR] ${url} -> ${error.message}`);
    }
  }

  console.log(
    `\nIndex status: ${indexed}/${urls.length} indexed, ${notIndexed}/${urls.length} not yet indexed or errored.`,
  );
} catch (error) {
  console.error("Index status check failed:", error.message);
  process.exit(1);
}
