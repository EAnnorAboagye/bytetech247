// One-off helper: prints the fluid clamp() values for the Phase 1 modular
// type scale so they don't have to be hand-computed. Not wired into any
// build step — run manually if the scale/ratio ever changes.
//
// Note: this prints a fluid value for every step including `base`, but
// global.css deliberately keeps `--text-base` (and xs/sm) static at their
// desktop size — shrinking body copy below 1rem on narrow viewports is a
// legibility regression. Only copy the lg-and-up lines into global.css.
const RATIO = 1.25;
const STEPS = {
  xs: -2,
  sm: -1,
  base: 0,
  lg: 1,
  xl: 2,
  "2xl": 3,
  "3xl": 4,
  "4xl": 5,
  "5xl": 6,
};
const MIN_VW = 320;
const MAX_VW = 1280; // px
const MOBILE_BASE = 0.875; // rem — same ratio, smaller base at narrow viewports
const DESKTOP_BASE = 1; // rem

function round(n) {
  return Math.round(n * 10000) / 10000;
}

for (const [name, n] of Object.entries(STEPS)) {
  const mult = Math.pow(RATIO, n);
  const min = round(MOBILE_BASE * mult);
  const max = round(DESKTOP_BASE * mult);
  if (name === "xs" || name === "sm") {
    console.log(`--text-${name}: ${max}rem;`);
    continue;
  }
  const slopePerPx = (max - min) / (MAX_VW - MIN_VW); // rem per px
  const intercept = round(min - slopePerPx * MIN_VW); // rem
  // The `vw` unit itself resolves directly to px (1vw = viewport-width/100,
  // in px), not rem — so the coefficient needs the rem->px conversion
  // (*16) that the additive rem term already gets for free from `rem`.
  const vwCoeff = round(slopePerPx * 100 * 16);
  console.log(
    `--text-${name}: clamp(${min}rem, ${intercept}rem + ${vwCoeff}vw, ${max}rem);`,
  );
}
