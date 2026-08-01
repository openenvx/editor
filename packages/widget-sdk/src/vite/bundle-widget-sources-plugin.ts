import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, ResolvedConfig } from 'vite';

export interface BundleWidgetSourcesOptions {
  /** Optional esbuild alias map. Rarely needed — packages resolve from exports. */
  alias?: Record<string, string>;
}

/** Import prefix: `import source from 'openenvx-widget:./seating.widget.tsx'`. */
export const OPENENVX_WIDGET_PREFIX = 'openenvx-widget:';
const RESOLVED_PREFIX = `\0${OPENENVX_WIDGET_PREFIX}`;

/**
 * Vite packaging plugin: turn a widget TSX entry into an IIFE **string** for QuickJS.
 * Not a runtime API — only delivery. After eval the module must call
 * `openenvx.widget.register` (or `define*Component`, which does).
 *
 * Dev HMR: invalidates the virtual module and accepts via `import.meta.hot`
 * so integrators can re-`pushWidgetSource` without a full page reload.
 *
 * ```ts
 * // vite.config.ts
 * plugins: [bundleWidgetSources()]
 *
 * // app.tsx — host never runs this; only a string payload for the isolate
 * import source from 'openenvx-widget:./seating.widget.tsx'
 * if (import.meta.hot) {
 *   import.meta.hot.accept((mod) => {
 *     void sandbox.pushWidgetSource('wm.seating', mod.default)
 *   })
 * }
 * await sandbox.pushWidgetSource('wm.seating', source)
 * ```
 */
export function bundleWidgetSources(
  options: BundleWidgetSourcesOptions = {}
): Plugin {
  let root = process.cwd();
  const alias = options.alias ?? {};
  const watched = new Set<string>();

  async function bundleWidget(entry: string): Promise<string> {
    const abs = path.isAbsolute(entry) ? entry : path.resolve(root, entry);
    if (!fs.existsSync(abs)) {
      throw new Error(`bundleWidgetSources: entry not found: ${abs}`);
    }

    const esbuild = await import('esbuild');
    const result = await esbuild.build({
      absWorkingDir: path.dirname(abs),
      alias,
      bundle: true,
      entryPoints: [abs],
      format: 'iife',
      jsx: 'automatic',
      jsxImportSource: 'preact',
      logLevel: 'silent',
      metafile: true,
      platform: 'neutral',
      target: 'es2020',
      write: false,
    });
    const file = result.outputFiles?.[0];
    if (!file) {
      throw new Error(
        `bundleWidgetSources: esbuild produced no output for ${abs}`
      );
    }

    for (const input of Object.keys(result.metafile?.inputs ?? {})) {
      watched.add(path.resolve(path.dirname(abs), input));
    }
    watched.add(abs);

    return file.text;
  }

  return {
    name: 'openenvx-bundle-widget-sources',
    configResolved(config: ResolvedConfig) {
      root = config.root;
    },
    resolveId(id, importer) {
      if (!id.startsWith(OPENENVX_WIDGET_PREFIX)) {
        return null;
      }
      const spec = id.slice(OPENENVX_WIDGET_PREFIX.length);
      const baseDir = importer
        ? path.dirname(importer.startsWith('\0') ? importer.slice(1) : importer)
        : root;
      const resolved = path.isAbsolute(spec)
        ? spec
        : path.resolve(baseDir, spec);
      return `${RESOLVED_PREFIX}${resolved}`;
    },
    async load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) {
        return null;
      }
      const entry = id.slice(RESOLVED_PREFIX.length);
      const source = await bundleWidget(entry);
      // HMR accept so importers can re-push without full-reload.
      return `export default ${JSON.stringify(source)};
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;
    },
    handleHotUpdate({ file, server }) {
      const relevant = watched.has(file) || file.includes('.widget.');
      if (!relevant) {
        return;
      }
      const mods = [...server.moduleGraph.idToModuleMap.values()].filter(
        (mod) => (mod.id ? mod.id.startsWith(RESOLVED_PREFIX) : false)
      );
      if (mods.length === 0) {
        return;
      }
      for (const mod of mods) {
        server.moduleGraph.invalidateModule(mod);
      }
      // Prefer module HMR over full-reload so apps can re-pushWidgetSource.
      return mods;
    },
  };
}
