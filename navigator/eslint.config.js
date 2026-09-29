import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Le props sono documentate nei commenti JSDoc dei componenti.
      "react/prop-types": "off",
      // L'interfaccia è in italiano: gli apostrofi nel testo JSX sono la norma.
      // Restano segnalati i caratteri che possono rompere il markup.
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
