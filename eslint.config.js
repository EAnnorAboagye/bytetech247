// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    // Node-executed config/dev scripts, not browser/Astro runtime code.
    files: ["*.config.mjs", "*.config.js", "scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // typescript-eslint's own guidance: base ESLint's no-undef doesn't
    // understand TS-only global types (HTMLElementTagNameMap, etc.) used
    // in type positions and produces false positives here — the
    // TypeScript compiler (astro check) already catches real undefined
    // references more accurately.
    files: ["**/*.ts", "**/*.astro"],
    rules: {
      "no-undef": "off",
    },
  },
);
