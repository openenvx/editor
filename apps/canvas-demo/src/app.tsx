import type { Plugin } from '@openenvx/core';
import {
  DEFAULT_STUDIO_PLUGINS,
  VersionHistoryPlugin,
  WorkbenchShell,
  createCanvasDemoScene,
  createCanvasPropertyHostContextWithApi,
  createLocalStorageWorkbenchLayoutStore,
  createPostMessagePluginPanelTransport,
  DEFAULT_CANVAS_LAYOUT,
  EmbedPanelHost,
} from '@xmazu/openenvxee-studio';

import { CanvasDemoChromePlugin } from './plugins/canvas-demo-chrome-plugin';
import { CanvasDemoPlugin } from './plugins/canvas-demo-plugin';
import { createDemoVersionHistoryProvider } from './providers/demo-version-history-provider';

import '@xmazu/openenvxee-studio/fonts.css';
import '@xmazu/openenvxee-studio/theme.css';

const EMBED_PANEL_ID = 'embed.demo';
const LAYOUT_STORE_KEY = 'openenvx.canvas-demo.workbench-layout';

function isEmbedMode(): boolean {
  return new URLSearchParams(window.location.search).get('embed') === '1';
}

function createPlugins(): Plugin[] {
  return [
    ...DEFAULT_STUDIO_PLUGINS,
    new CanvasDemoPlugin(),
    new CanvasDemoChromePlugin(),
    new VersionHistoryPlugin({
      provider: createDemoVersionHistoryProvider(),
    }),
  ];
}

function createEmbedPanels(): EmbedPanelHost[] | undefined {
  if (!isEmbedMode()) {
    return undefined;
  }
  return [
    new EmbedPanelHost({
      declaration: {
        id: EMBED_PANEL_ID,
        title: 'Embed',
        allowedCommands: [],
        contextScope: 'selection',
      },
      permission: 'edit',
      transport: createPostMessagePluginPanelTransport({
        allowedOrigins: [window.location.origin],
      }),
    }),
  ];
}

function promptUri(message: string, defaultValue?: string): string | null {
  // Demo-only input; production apps should replace with a proper dialog.
  // eslint-disable-next-line no-alert
  return window.prompt(message, defaultValue);
}

const layoutStore = createLocalStorageWorkbenchLayoutStore(LAYOUT_STORE_KEY);

export function App() {
  return (
    <div className="canvas-demo-app">
      <WorkbenchShell
        className="canvas-workbench"
        createPropertyHostContext={createCanvasPropertyHostContextWithApi}
        editorTitle="Canvas"
        editorUri="openworkbench://canvas-demo"
        embedPanels={createEmbedPanels()}
        initialScene={createCanvasDemoScene()}
        layout={DEFAULT_CANVAS_LAYOUT}
        layoutStore={layoutStore}
        onOpenDocument={async () => promptUri('Open document URI') ?? undefined}
        onSaveAs={async () =>
          promptUri('Save as URI', 'openworkbench://canvas-demo') ?? undefined
        }
        plugins={createPlugins()}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-demo-app { height: 100%; display: flex; flex-direction: column; }
        .canvas-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
