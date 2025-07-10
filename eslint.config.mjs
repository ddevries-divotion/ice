import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "no-undef": ["warn", { typeof: false }],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
    languageOptions: {
      globals: {
        ice: "readonly",
        module: "writable", // Allow module for Node/CommonJS environments
        exports: "writable", // Allow exports for Node/CommonJS environments
        require: "readonly" // Optional: allow require if used
      }
    }
  }
]);
