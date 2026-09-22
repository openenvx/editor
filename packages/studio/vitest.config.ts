import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        // Zod v4 ESM default export; vitest's prebundle breaks `import { z }`.
        inline: ['zod'],
      },
    },
  },
});
