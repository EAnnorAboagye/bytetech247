const WORDS_PER_MINUTE = 200;
const CODE_LINES_PER_MINUTE = 40; // code reads slower than prose

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;

/**
 * Prose word count from raw MDX source, code blocks excluded — shared by
 * calculateReadingTime below and the Article schema's wordCount field
 * (src/lib/json-ld.ts), so the two never derive it two different ways.
 */
export function countWords(rawBody: string): number {
  const proseText = rawBody.replace(CODE_BLOCK_PATTERN, "");
  return proseText.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Build-time reading-time estimate from raw MDX source: prose is weighted
 * at a ~200wpm baseline, code-block lines separately at a slower rate,
 * per build-spec.md Phase 3.
 */
export function calculateReadingTime(rawBody: string): number {
  const codeBlocks = rawBody.match(CODE_BLOCK_PATTERN) ?? [];
  const codeLineCount = codeBlocks.reduce(
    (total, block) => total + block.split("\n").length,
    0,
  );

  const minutes =
    countWords(rawBody) / WORDS_PER_MINUTE +
    codeLineCount / CODE_LINES_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
