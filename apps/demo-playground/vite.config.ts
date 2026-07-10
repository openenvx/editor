import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * TanStack Start + Vite 8 dev middleware workaround for bun monorepos.
 * See: https://github.com/TanStack/router/issues/7418
 */
function tanstackVirtualUrlShim(): Plugin {
  return {
    name: 'tanstack-start:virtual-url-shim',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/@id/virtual:tanstack-')) {
          req.url = req.url.replace('/@id/virtual:', '/@id/__x00__virtual:');
        }
        next();
      });
    },
  };
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    tanstackVirtualUrlShim(),
    viteReact(),
  ],
});

export default config;
