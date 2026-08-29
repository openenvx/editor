import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    server: {
      deps: {
        // Zod v4 ESM default export; vitest's prebundle breaks `import { z }`.
        inline: ['zod'],
      },
    },
  },
});
