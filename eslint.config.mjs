import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.tmp-*',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'vendor/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['web/**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      'api/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
      'types/**/*.{js,mjs,cjs,ts,tsx,mts,cts}',
      '*.config.{js,mjs,cjs,ts,mts,cts}',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
