const WORDS_PER_MINUTE = 200;
const CODE_LINES_PER_MINUTE = 40; // code reads slower than prose

/**
 * Build-time reading-time estimate from raw MDX source: prose is weighted
 * at a ~200wpm baseline, code-block lines separately at a slower rate,
 * per build-spec.md Phase 3.
 */
export function calculateReadingTime(rawBody: string): number {
  const codeBlockPattern = /```[\s\S]*?```/g;
  const codeBlocks = rawBody.match(codeBlockPattern) ?? [];
  const codeLineCount = codeBlocks.reduce(
    (total, block) => total + block.split("\n").length,
    0,
  );

  const proseText = rawBody.replace(codeBlockPattern, "");
  const wordCount = proseText.trim().split(/\s+/).filter(Boolean).length;

  const minutes =
    wordCount / WORDS_PER_MINUTE + codeLineCount / CODE_LINES_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
