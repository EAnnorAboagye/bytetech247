// Generates an abstract/conceptual cover photo via Cloudflare Workers AI
// (@cf/black-forest-labs/flux-1-schnell) for a post whose topic is
// conceptual enough that write-article's own Pexels-sourcing step (§3)
// would normally apply, but no real Pexels photo was a genuine fit. Not
// part of the build — run manually:
//   node scripts/generate-conceptual-cover.mjs <outfile> "<prompt>"
//
// Scope, matching write-article §3 and every category skill's cover-image
// section: this is for ABSTRACT/ILLUSTRATIVE imagery only — never a
// screenshot, terminal capture, API/payload response, chart, or anything
// that could be mistaken for a real captured artifact. Diffusion models
// are also well known to render garbled, nonsense pseudo-text when a
// prompt implies any text/UI/data element, which would be actively
// misleading on a site whose whole premise is verified technical claims —
// so every generation is forced through a fixed negative-constraint
// suffix (below) rather than trusting each caller to remember it.
//
// Requires CLOUDFLARE_API_TOKEN (Workers AI permission) and
// CLOUDFLARE_ACCOUNT_ID in `.dev.vars` — same "local-authoring secret,
// never shipped to the deployed Worker" pattern as PEXELS_API_KEY, see
// docs/ENVIRONMENT.md. Read directly from `.dev.vars` here rather than
// relying on the caller having sourced it into the shell first, the same
// robustness reasoning that keeps make-terminal-cover.mjs and
// make-comparison-cover.mjs as standalone scripts instead of inline curl.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const [, , outFile, prompt] = process.argv;

if (!outFile || !prompt) {
  console.error(
    'Usage: node scripts/generate-conceptual-cover.mjs <outfile> "<prompt>"',
  );
  process.exit(1);
}

function readDevVar(name) {
  if (!existsSync(".dev.vars")) {
    console.error(
      ".dev.vars not found. Copy .dev.vars.example to .dev.vars and fill in CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID.",
    );
    process.exit(1);
  }
  const contents = readFileSync(".dev.vars", "utf8");
  const match = contents.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!match) {
    console.error(`${name} not set in .dev.vars.`);
    process.exit(1);
  }
  return match[1].trim();
}

const apiToken = readDevVar("CLOUDFLARE_API_TOKEN");
const accountId = readDevVar("CLOUDFLARE_ACCOUNT_ID");

// Forced on every call — never left to the caller's prompt wording. Keeps
// this script's output structurally incapable of being mistaken for a
// real screenshot, chart, or captured data, regardless of what the
// subject-matter prompt asks for.
const NEGATIVE_SUFFIX =
  ", abstract digital illustration style, no readable text, no words, no letters, no user interface, no screenshot, no terminal window, no code, no charts, no data visualization, no logos";

const fullPrompt = `${prompt}${NEGATIVE_SUFFIX}`;
if (fullPrompt.length > 2048) {
  console.error(
    `Prompt too long after appending the required negative-constraint suffix (${fullPrompt.length} chars, max 2048). Shorten the subject prompt.`,
  );
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: fullPrompt, steps: 8 }),
});

if (!response.ok) {
  console.error(
    `Workers AI request failed: ${response.status} ${response.statusText}`,
  );
  console.error(await response.text());
  process.exit(1);
}

const body = await response.json();
if (!body.success || !body.result?.image) {
  console.error("Workers AI response missing an image:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

writeFileSync(outFile, Buffer.from(body.result.image, "base64"));
console.log(`Wrote ${outFile}`);
console.log(`Prompt used: ${fullPrompt}`);
