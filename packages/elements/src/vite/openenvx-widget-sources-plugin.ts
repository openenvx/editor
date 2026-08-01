import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, ResolvedConfig } from 'vite';

export interface OpenEnvxWidgetsOptions {
  /** Optional esbuild alias map. Rarely needed — packages resolve from exports. */
  alias?: Record<string, string>;
}

/** Import prefix: `import source from 'openenvx-widget:./seating.widget.tsx'`. */
export const OPENENVX_WIDGET_PREFIX = 'openenvx-widget:';
const RESOLVED_PREFIX = `\0${OPENENVX_WIDGET_PREFIX}`;

/**
 * Vite plugin: turn a widget TSX entry into an IIFE **string** for QuickJS.
 *
 * ```ts
 * // vite.config.ts
 * plugins: [openenvxWidgets()]
 *
 * // app.tsx — host never runs this; only a string payload for the isolate
 * import source from 'openenvx-widget:./seating.widget.tsx'
 * await sandbox.pushWidgetSource('wm.seating', source)
 * ```
 */
export function openenvxWidgets(options: OpenEnvxWidgetsOptions = {}): Plugin {
  let root = process.cwd();
  const alias = options.alias ?? {};
  const watched = new Set<string>();

  async function bundleWidget(entry: string): Promise<string> {
    const abs = path.isAbsolute(entry) ? entry : path.resolve(root, entry);
    if (!fs.existsSync(abs)) {
      throw new Error(`openenvxWidgets: entry not found: ${abs}`);
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
      throw new Error(`openenvxWidgets: esbuild produced no output for ${abs}`);
    }

    for (const input of Object.keys(result.metafile?.inputs ?? {})) {
      watched.add(path.resolve(path.dirname(abs), input));
    }
    watched.add(abs);

    return file.text;
  }

  return {
    name: 'openenvx-widgets',
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
      return `export default ${JSON.stringify(source)};\n`;
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
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

/** @deprecated Use {@link openenvxWidgets}. */
export function openenvxWidgetSources(
  options: OpenEnvxWidgetsOptions = {}
): Plugin {
  return openenvxWidgets(options);
}
