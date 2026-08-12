import { describe, it, expect } from "vitest";
import {
  estimateClaudeTokens,
  estimateGeminiTokens,
} from "../../src/lib/token-estimate";

// These are approximations by design (see src/lib/token-estimate.ts's own
// comment on why) — the tests cover the arithmetic/edge-case behavior the
// widget depends on, not "correctness" against a real tokenizer, which
// doesn't exist client-side for these two model families.
describe("estimateClaudeTokens", () => {
  it("returns 0 for empty text", () => {
    expect(estimateClaudeTokens("")).toBe(0);
  });

  it("never returns less than 1 token for any non-empty text", () => {
    expect(estimateClaudeTokens("a")).toBeGreaterThanOrEqual(1);
  });

  it("scales roughly with character count (~3.5 chars/token)", () => {
    const text = "a".repeat(350);
    expect(estimateClaudeTokens(text)).toBe(100);
  });

  it("counts whitespace-only text towards length like any other characters", () => {
    expect(estimateClaudeTokens("     ")).toBeGreaterThanOrEqual(1);
  });

  it("handles unicode/emoji without throwing", () => {
    expect(() => estimateClaudeTokens("héllo 👋 world 世界")).not.toThrow();
    expect(estimateClaudeTokens("héllo 👋 world 世界")).toBeGreaterThan(0);
  });
});

describe("estimateGeminiTokens", () => {
  it("returns 0 for empty text", () => {
    expect(estimateGeminiTokens("")).toBe(0);
  });

  it("never returns less than 1 token for any non-empty text", () => {
    expect(estimateGeminiTokens("a")).toBeGreaterThanOrEqual(1);
  });

  it("scales roughly with character count (~4 chars/token)", () => {
    const text = "a".repeat(400);
    expect(estimateGeminiTokens(text)).toBe(100);
  });

  it("handles unicode/emoji without throwing", () => {
    expect(() => estimateGeminiTokens("héllo 👋 world 世界")).not.toThrow();
    expect(estimateGeminiTokens("héllo 👋 world 世界")).toBeGreaterThan(0);
  });
});

describe("estimateClaudeTokens vs estimateGeminiTokens", () => {
  it("Gemini's larger chars-per-token divisor yields a lower-or-equal count for the same text", () => {
    const text = "The quick brown fox jumps over the lazy dog. ".repeat(20);
    expect(estimateGeminiTokens(text)).toBeLessThanOrEqual(
      estimateClaudeTokens(text),
    );
  });
});
