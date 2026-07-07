import { defineConfig } from 'oxfmt';
import ultracite from 'ultracite/oxfmt';

export default defineConfig({
  ...ultracite,
  singleQuote: true,
  ignorePatterns: [
    '**/*.json',
    '**/*.jsonc',
    'bunfig.toml',
    '**/*.test.*',
    '**/*.spec.*',
    '**/__tests__/**',
    '**/.changeset/**',
    '**/CHANGELOG.md',
  ],
});
