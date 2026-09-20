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
    '**/CHANGELOG.md',
    '**/routeTree.gen.ts',
    // Next.js rewrites this file on build/dev; quote style must not fail precommit.
    '**/next-env.d.ts',
  ],
});
