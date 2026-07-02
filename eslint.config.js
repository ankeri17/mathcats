// Flat ESLint config. Deliberately lean: TypeScript recommended + React hooks.
// tsc (strict) already covers most correctness; lint exists chiefly to make the
// hooks rules real — every exhaustive-deps suppression must be a reviewed,
// justified decision, not decoration.
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // tsc's noUnusedLocals already enforces this; avoid double reporting.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
