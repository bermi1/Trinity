import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'dist-e2e', 'design', 'node_modules', 'test-results'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^e$|^pp$|^ps$|^narrow$', caughtErrors: 'none' }],
      // Components receive plain callback refs through props; this rule misreads them.
      'react-hooks/refs': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    // Playwright fixtures take a parameter named `use`; it is not the React hook.
    files: ['e2e/**'],
    rules: { 'react-hooks/rules-of-hooks': 'off' }
  }
];
