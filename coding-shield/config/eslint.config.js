import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

/** ESLint + SonarJS (SonarLint-equivalent rules) for Coding Shield scans */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/backend/public/**',
      '**/project/android/**',
      'coding-shield/reports/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    files: ['project/src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'sonarjs/cognitive-complexity': ['warn', 20],
    },
  },
  {
    // Pasted Coding Shield snippets only: safe rules ESLint can fix by itself, so the scan
    // returns improved code. The repo's own files are not affected.
    files: ['project/src/snippet.*'],
    rules: {
      'no-var': 'warn',
      'prefer-const': 'warn',
      'object-shorthand': 'warn',
      'dot-notation': 'warn',
    },
  },
);
