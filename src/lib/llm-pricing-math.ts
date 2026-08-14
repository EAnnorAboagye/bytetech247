// Pure cost-calculation logic for the LLM Pricing Calculator — no DOM, no
// side effects, fully unit-testable (see tests/unit/llm-pricing-math.test.ts),
// mirroring how src/lib/token-estimate.ts stays separate from
// TokenCounterWidget.astro's DOM-handling code.
import type { ModelVariant } from "./llm-pricing-data";

export interface CostInput {
  inputTokens: number;
  outputTokens: number;
  /** Subset of inputTokens actually read from or written to cache. */
  cachedTokens: number;
  /** Index into variant.cacheTiers, or null for no caching applied. */
  cacheTierIndex: number | null;
  /** true = this call is populating the cache (pay the write rate). */
  isCacheWrite: boolean;
}

export interface CostBreakdown {
  inputCost: number;
  cachedCost: number;
  outputCost: number;
  totalCost: number;
}

// Widget calls calculateCost on every keystroke, including transient empty-
// field states — a NaN/negative field is a normal mid-typing state, not an
// error condition, so it's clamped to zero rather than thrown.
function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateCost(
  variant: ModelVariant,
  input: CostInput,
): CostBreakdown {
  const inputTokens = sanitize(input.inputTokens);
  const outputTokens = sanitize(input.outputTokens);
  // Cached tokens are a subset of input tokens — clamped so uncached input
  // never goes negative regardless of what the caller passes in.
  const cachedTokens = Math.min(sanitize(input.cachedTokens), inputTokens);
  const uncachedTokens = inputTokens - cachedTokens;

  const inputCost = (uncachedTokens / 1_000_000) * variant.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * variant.outputPerMillion;

  let cachedCost = 0;
  if (cachedTokens > 0) {
    const tier =
      input.cacheTierIndex !== null
        ? variant.cacheTiers[input.cacheTierIndex]
        : undefined;
    // No valid tier (Gemini's cacheTiers: [], or an out-of-range index) —
    // fall back to the standard input rate rather than throwing or silently
    // discounting tokens with no confirmed rate to discount them against.
    const multiplier = tier
      ? input.isCacheWrite
        ? tier.writeMultiplier
        : tier.readMultiplier
      : 1;
    cachedCost =
      (cachedTokens / 1_000_000) * variant.inputPerMillion * multiplier;
  }

  return {
    inputCost,
    cachedCost,
    outputCost,
    totalCost: inputCost + cachedCost + outputCost,
  };
}
