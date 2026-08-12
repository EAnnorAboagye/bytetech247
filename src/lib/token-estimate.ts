// Character-based token estimates for models with no public client-side
// tokenizer (Claude, Gemini) — their real counts require a server-side API
// call, out of scope for a client-side-only tool (see the AI Token Counter
// plan). These are approximations, not exact counts, and the UI must say
// so explicitly rather than presenting them with the same confidence as
// the GPT count (which uses OpenAI's real tiktoken algorithm, see
// TokenCounterWidget.astro).

// Anthropic's own public guidance: roughly 3.5 characters per token for
// English text, varying by language/content and by Claude generation —
// the most authoritative figure available for this model family.
const CLAUDE_CHARS_PER_TOKEN = 3.5;

// No equivalently well-sourced official figure exists for Gemini; 4
// characters/token is the widely-used generic cross-model rule of thumb.
// Less confidently sourced than the Claude figure above — flagged as such
// in the page's own "How this works" copy, not just in this comment.
const GEMINI_CHARS_PER_TOKEN = 4;

function estimateFromCharCount(text: string, charsPerToken: number): number {
  if (text.length === 0) return 0;
  return Math.max(1, Math.round(text.length / charsPerToken));
}

export function estimateClaudeTokens(text: string): number {
  return estimateFromCharCount(text, CLAUDE_CHARS_PER_TOKEN);
}

export function estimateGeminiTokens(text: string): number {
  return estimateFromCharCount(text, GEMINI_CHARS_PER_TOKEN);
}
