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
// for a bearer token at Google's OAuth endpoint), hand-rolled with Node's
// built-in crypto rather than pulling in google-auth-library/googleapis —
// the whole flow is two fetches and one signature, not worth a dependency
// for that. Requires the service account to be added as an Owner on this
// property in Search Console (Settings -> Users and permissions) — the API
// call fails with a permissions error otherwise, not a silent no-op.
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
import { createSign } from "node:crypto";

const INDEXING_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/indexing";

const rawCredentials = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT;

if (!rawCredentials) {
  console.log(
    "GOOGLE_INDEXING_SERVICE_ACCOUNT not set — skipping Google Indexing API submission. " +
      "See scripts/submit-google-indexing.mjs for setup.",
  );
  process.exit(0);
}

const { client_email: clientEmail, private_key: privateKey } =
  JSON.parse(rawCredentials);

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const jwt = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Token exchange failed: ${response.status} ${JSON.stringify(body)}`,
    );
  }
  return body.access_token;
}

const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.error("No URLs found in dist/sitemap.xml — nothing to submit.");
  process.exit(0);
}

try {
  const accessToken = await getAccessToken();
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
