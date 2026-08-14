// Static pricing data for the LLM Pricing Calculator (src/pages/tools/
// llm-pricing-calculator.astro + src/components/LlmPricingCalculatorWidget.astro).
// No backend/API call exists for live pricing — none of OpenAI, Anthropic, or
// Google expose a public unauthenticated pricing endpoint, and this site is
// output: 'static' with no per-request backend anyway — so this module is the
// single source of truth, bundled at build time like src/lib/token-estimate.ts.
//
// PRICING_DATA_VERIFIED_DATE is deliberately separate from this page's own
// git-history "Last verified" date (src/lib/last-verified.ts): a page-edit
// timestamp is not evidence the dollar figures themselves were re-checked
// against each provider's live pricing page. Update this string by hand
// whenever the numbers below are re-verified — that discipline is why this
// tool exists in the first place: the site's own gemini-3-6-flash-output-
// tokens-price-cut post cited Gemini 3.6 Flash's 2027 price as if it were
// current, undetected until this file's own research pass fetched Google's
// pricing page directly.
export const PRICING_DATA_VERIFIED_DATE = "2026-08-13";

export type Provider = "openai" | "anthropic" | "google";

export interface CacheTierPricing {
  /** Multiplier on the base input rate for a cache WRITE at this tier. */
  writeMultiplier: number;
  /** Multiplier on the base input rate for a cache READ (hit) at this tier. */
  readMultiplier: number;
  /** Human label, e.g. "5-minute", "1-hour", "Standard (30 min-24h retention)". */
  label: string;
}

export interface ModelVariant {
  id: string;
  label: string;
  provider: Provider;
  inputPerMillion: number;
  outputPerMillion: number;
  /** Empty array = no confirmed cache-pricing multipliers for this variant. */
  cacheTiers: CacheTierPricing[];
  /**
   * Set only when caching is known to exist but no provider-published
   * discount rate could be confirmed (Gemini, as of this data's verified
   * date) — distinct from cacheTiers: [] on its own, which could otherwise
   * be misread as "caching doesn't exist" rather than "rate unconfirmed."
   */
  cachingNote?: string;
  tokenizerNote?: string;
  source: string;
  /** ISO date. Staged/future pricing only (Gemini's 2027 rate). */
  effectiveFrom?: string;
  effectiveUntil?: string;
}

const OPENAI_CACHE_TIER: CacheTierPricing = {
  writeMultiplier: 1.25,
  readMultiplier: 0.1,
  label: "Standard (30 min-24h retention)",
};

const CLAUDE_CACHE_TIERS: CacheTierPricing[] = [
  { writeMultiplier: 1.25, readMultiplier: 0.1, label: "5-minute" },
  { writeMultiplier: 2, readMultiplier: 0.1, label: "1-hour" },
];

const CLAUDE_TOKENIZER_NOTE =
  "Claude's tokenizer (4.7+) counts roughly 30-35% more tokens than pre-4.7 models for the same input text.";

const GEMINI_CACHING_NOTE =
  "Google confirms implicit caching is enabled by default (4,096-token minimum, cost savings passed on automatically) but does not publish an exact discount rate — standard pricing is used below until one is confirmed.";

const OPENAI_SOURCE = "https://developers.openai.com/api/docs/pricing";
const ANTHROPIC_SOURCE = "https://docs.claude.com/en/docs/about-claude/pricing";
const GOOGLE_SOURCE = "https://ai.google.dev/gemini-api/docs/pricing";

export const MODEL_VARIANTS: ModelVariant[] = [
  // --- OpenAI GPT-5.6 family ---
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol (flagship)",
    provider: "openai",
    inputPerMillion: 5.0,
    outputPerMillion: 30.0,
    cacheTiers: [OPENAI_CACHE_TIER],
    source: OPENAI_SOURCE,
  },
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    provider: "openai",
    inputPerMillion: 2.0,
    outputPerMillion: 12.0,
    cacheTiers: [OPENAI_CACHE_TIER],
    source: OPENAI_SOURCE,
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    provider: "openai",
    inputPerMillion: 0.2,
    outputPerMillion: 1.2,
    cacheTiers: [OPENAI_CACHE_TIER],
    source: OPENAI_SOURCE,
  },
  {
    id: "gpt-5.6-cyber",
    label: "GPT-5.6 Cyber",
    provider: "openai",
    inputPerMillion: 12.5,
    outputPerMillion: 75.0,
    cacheTiers: [OPENAI_CACHE_TIER],
    source: OPENAI_SOURCE,
  },

  // --- Anthropic Claude Opus 4.7 / 4.8 ---
  {
    id: "claude-opus-4.7",
    label: "Claude Opus 4.7 (standard)",
    provider: "anthropic",
    inputPerMillion: 5,
    outputPerMillion: 25,
    cacheTiers: CLAUDE_CACHE_TIERS,
    tokenizerNote: CLAUDE_TOKENIZER_NOTE,
    source: ANTHROPIC_SOURCE,
  },
  {
    id: "claude-opus-4.7-fast",
    label: "Claude Opus 4.7 (Fast Mode)",
    provider: "anthropic",
    inputPerMillion: 30,
    outputPerMillion: 150,
    cacheTiers: CLAUDE_CACHE_TIERS,
    tokenizerNote: CLAUDE_TOKENIZER_NOTE,
    source: ANTHROPIC_SOURCE,
  },
  {
    id: "claude-opus-4.8",
    label: "Claude Opus 4.8 (standard)",
    provider: "anthropic",
    inputPerMillion: 5,
    outputPerMillion: 25,
    cacheTiers: CLAUDE_CACHE_TIERS,
    tokenizerNote: CLAUDE_TOKENIZER_NOTE,
    source: ANTHROPIC_SOURCE,
  },
  {
    id: "claude-opus-4.8-fast",
    label: "Claude Opus 4.8 (Fast Mode)",
    provider: "anthropic",
    inputPerMillion: 10,
    outputPerMillion: 50,
    cacheTiers: CLAUDE_CACHE_TIERS,
    tokenizerNote: CLAUDE_TOKENIZER_NOTE,
    source: ANTHROPIC_SOURCE,
  },

  // --- Google Gemini 3.6 Flash — staged pricing, both shown in the UI ---
  {
    id: "gemini-3.6-flash-2026",
    label: "Gemini 3.6 Flash (now through 2026-12-31)",
    provider: "google",
    inputPerMillion: 0.75,
    outputPerMillion: 3.75,
    cacheTiers: [],
    cachingNote: GEMINI_CACHING_NOTE,
    source: GOOGLE_SOURCE,
    effectiveUntil: "2026-12-31",
  },
  {
    id: "gemini-3.6-flash-2027",
    label: "Gemini 3.6 Flash (from 2027-01-01)",
    provider: "google",
    inputPerMillion: 1.5,
    outputPerMillion: 7.5,
    cacheTiers: [],
    cachingNote: GEMINI_CACHING_NOTE,
    source: GOOGLE_SOURCE,
    effectiveFrom: "2027-01-01",
  },
];

export function getModelVariant(id: string): ModelVariant | undefined {
  return MODEL_VARIANTS.find((variant) => variant.id === id);
}
