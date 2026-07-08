import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    ignores: ["dist/", ".astro/", "node_modules/"],
  },
);
