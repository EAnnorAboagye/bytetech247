import { describe, it, expect } from "vitest";
import { calculateCost } from "../../src/lib/llm-pricing-math";
import { getModelVariant } from "../../src/lib/llm-pricing-data";

const gptSol = getModelVariant("gpt-5.6-sol")!;
const claude47 = getModelVariant("claude-opus-4.7")!;
const geminiCurrent = getModelVariant("gemini-3.6-flash-2026")!;

describe("calculateCost", () => {
  it("returns an all-zero breakdown for zero tokens", () => {
    expect(
      calculateCost(gptSol, {
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        cacheTierIndex: null,
        isCacheWrite: false,
      }),
    ).toEqual({ inputCost: 0, cachedCost: 0, outputCost: 0, totalCost: 0 });
  });

  it("computes input-only cost with no output and no cache", () => {
    const result = calculateCost(gptSol, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 0,
      cacheTierIndex: null,
      isCacheWrite: false,
    });
    expect(result.inputCost).toBeCloseTo(5.0);
    expect(result.outputCost).toBe(0);
    expect(result.cachedCost).toBe(0);
    expect(result.totalCost).toBeCloseTo(5.0);
  });

  it("golden example: GPT-5.6 Sol, 1M in + 1M out, no cache = exactly $35", () => {
    const result = calculateCost(gptSol, {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cachedTokens: 0,
      cacheTierIndex: null,
      isCacheWrite: false,
    });
    expect(result.totalCost).toBeCloseTo(35.0);
  });

  it("cache write costs more than cache read for identical cached-token counts", () => {
    const writeResult = calculateCost(claude47, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 1_000_000,
      cacheTierIndex: 1, // 1-hour tier: write 2x, read 0.1x
      isCacheWrite: true,
    });
    const readResult = calculateCost(claude47, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 1_000_000,
      cacheTierIndex: 1,
      isCacheWrite: false,
    });
    expect(writeResult.cachedCost).toBeGreaterThan(readResult.cachedCost);
    // 1-hour tier: write = 2x base rate, read = 0.1x base rate.
    expect(writeResult.cachedCost).toBeCloseTo(5 * 2);
    expect(readResult.cachedCost).toBeCloseTo(5 * 0.1);
  });

  it("Claude's two cache tiers (5-minute vs 1-hour) price writes differently", () => {
    const fiveMinWrite = calculateCost(claude47, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 1_000_000,
      cacheTierIndex: 0, // 5-minute: write 1.25x
      isCacheWrite: true,
    });
    const oneHourWrite = calculateCost(claude47, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 1_000_000,
      cacheTierIndex: 1, // 1-hour: write 2x
      isCacheWrite: true,
    });
    expect(oneHourWrite.cachedCost).toBeGreaterThan(fiveMinWrite.cachedCost);
  });

  it("clamps cachedTokens to inputTokens rather than going negative", () => {
    const result = calculateCost(gptSol, {
      inputTokens: 100,
      outputTokens: 0,
      cachedTokens: 10_000, // absurdly over inputTokens
      cacheTierIndex: 0,
      isCacheWrite: false,
    });
    expect(result.inputCost).toBeGreaterThanOrEqual(0);
    expect(result.totalCost).toBeGreaterThanOrEqual(0);
  });

  it("falls back to standard input rate when cacheTiers is empty (Gemini path), without throwing", () => {
    expect(() =>
      calculateCost(geminiCurrent, {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cachedTokens: 500_000,
        cacheTierIndex: 0, // no tier exists at this index — cacheTiers is []
        isCacheWrite: false,
      }),
    ).not.toThrow();

    const result = calculateCost(geminiCurrent, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 500_000,
      cacheTierIndex: 0,
      isCacheWrite: false,
    });
    // No discount applied — cached half billed at the same rate as uncached half.
    expect(result.totalCost).toBeCloseTo(
      (1_000_000 / 1_000_000) * geminiCurrent.inputPerMillion,
    );
  });

  it("falls back to standard input rate when cacheTierIndex is null", () => {
    const result = calculateCost(claude47, {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedTokens: 1_000_000,
      cacheTierIndex: null,
      isCacheWrite: true,
    });
    expect(result.cachedCost).toBeCloseTo(5.0);
  });

  it("treats negative or NaN inputs as zero rather than throwing", () => {
    expect(() =>
      calculateCost(gptSol, {
        inputTokens: -500,
        outputTokens: NaN,
        cachedTokens: -10,
        cacheTierIndex: 0,
        isCacheWrite: false,
      }),
    ).not.toThrow();

    const result = calculateCost(gptSol, {
      inputTokens: -500,
      outputTokens: NaN,
      cachedTokens: -10,
      cacheTierIndex: 0,
      isCacheWrite: false,
    });
    expect(result).toEqual({
      inputCost: 0,
      cachedCost: 0,
      outputCost: 0,
      totalCost: 0,
    });
  });

  it("an out-of-range cacheTierIndex falls back to standard rate instead of throwing", () => {
    expect(() =>
      calculateCost(claude47, {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cachedTokens: 1_000_000,
        cacheTierIndex: 99,
        isCacheWrite: false,
      }),
    ).not.toThrow();
  });
});
