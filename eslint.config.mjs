import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs["flat/recommended"],
  {
    // astro-eslint-parser delegates the frontmatter to parserOptions.parser;
    // without this it falls back to espree and chokes on TypeScript syntax.
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
);
