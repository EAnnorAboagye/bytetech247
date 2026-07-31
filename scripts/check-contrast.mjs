import { wcagContrast, formatHex } from "culori";

// Candidate token values — OKLCH(L, C, H). Neutral and accent each defined
// once (single hue+chroma "source"); light/dark only vary lightness picks
// from that same source, per Phase 1's "one source, not two palettes" rule.
const NEUTRAL_H = 250;
const NEUTRAL_C = 0.012;
const ACCENT_H = 177;

const tokens = {
  light: {
    bg: { l: 0.985, c: NEUTRAL_C, h: NEUTRAL_H },
    bgSubtle: { l: 0.955, c: NEUTRAL_C, h: NEUTRAL_H },
    border: { l: 0.64, c: NEUTRAL_C, h: NEUTRAL_H },
    fgMuted: { l: 0.46, c: NEUTRAL_C, h: NEUTRAL_H },
    fg: { l: 0.19, c: NEUTRAL_C, h: NEUTRAL_H },
    accent: { l: 0.46, c: 0.11, h: ACCENT_H },
    accentFg: { l: 0.98, c: NEUTRAL_C, h: NEUTRAL_H },
  },
  dark: {
    bg: { l: 0.15, c: NEUTRAL_C, h: NEUTRAL_H },
    bgSubtle: { l: 0.2, c: NEUTRAL_C, h: NEUTRAL_H },
    border: { l: 0.5, c: NEUTRAL_C, h: NEUTRAL_H },
    fgMuted: { l: 0.68, c: NEUTRAL_C, h: NEUTRAL_H },
    fg: { l: 0.96, c: NEUTRAL_C, h: NEUTRAL_H },
    accent: { l: 0.78, c: 0.12, h: ACCENT_H },
    accentFg: { l: 0.15, c: NEUTRAL_C, h: NEUTRAL_H },
  },
};

function hex(t) {
  return formatHex({ mode: "oklch", l: t.l, c: t.c, h: t.h });
}

function check(mode, label, aTok, bTok, threshold) {
  const a = hex(aTok);
  const b = hex(bTok);
  const ratio = wcagContrast(a, b);
  const pass = ratio >= threshold;
  console.log(
    `[${mode}] ${label.padEnd(32)} ${a} vs ${b}  ratio=${ratio.toFixed(2)}  need>=${threshold}  ${pass ? "PASS" : "FAIL"}`,
  );
  return pass;
}

let allPass = true;
for (const mode of ["light", "dark"]) {
  const t = tokens[mode];
  allPass = check(mode, "fg on bg (body text)", t.fg, t.bg, 4.5) && allPass;
  allPass =
    check(mode, "fgMuted on bg (large text only)", t.fgMuted, t.bg, 3.0) &&
    allPass;
  allPass =
    check(mode, "fgMuted on bg (if used as body)", t.fgMuted, t.bg, 4.5) &&
    allPass;
  allPass =
    check(mode, "accent on bg (link text)", t.accent, t.bg, 4.5) && allPass;
  allPass =
    check(
      mode,
      "accentFg on accent (button text)",
      t.accentFg,
      t.accent,
      4.5,
    ) && allPass;
  allPass =
    check(mode, "border vs bg (non-text UI 3:1)", t.border, t.bg, 3.0) &&
    allPass;
}

console.log("\nHex values:");
for (const mode of ["light", "dark"]) {
  console.log(
    mode,
    Object.fromEntries(
      Object.entries(tokens[mode]).map(([k, v]) => [k, hex(v)]),
    ),
  );
}

console.log(
  allPass
    ? "\nALL REQUIRED PAIRINGS PASS"
    : "\nSOME PAIRINGS FAIL — adjust lightness/chroma",
);
