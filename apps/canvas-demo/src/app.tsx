import type { Plugin } from '@openenvx/core';
import type { WorkbenchApi } from '@openenvx/headless';
import {
  DEFAULT_STUDIO_PLUGINS,
  VersionHistoryPlugin,
  WorkbenchShell,
  createCanvasDemoScene,
  createCanvasPropertyHostContextWithApi,
  createLocalStorageWorkbenchLayoutStore,
  createPostMessagePluginPanelTransport,
  createSandboxExtensionHost,
  DEFAULT_CANVAS_LAYOUT,
  EmbedPanelHost,
  mountEmbedPanel,
  mountSandboxExtensions,
} from '@xmazu/openenvxee-studio';
import saveTheDateSource from 'openenvx-widget:./extensions/save-the-date.widget.tsx';
import seatingSource from 'openenvx-widget:./extensions/seating.widget.tsx';
import { useMemo } from 'react';

import saveTheDateManifest from './extensions/save-the-date.extension';
import seatingManifest from './extensions/seating.extension';
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

function promptUri(message: string, defaultValue?: string): string | null {
  // Demo-only input; production apps should replace with a proper dialog.
  // eslint-disable-next-line no-alert
  return window.prompt(message, defaultValue);
}

const layoutStore = createLocalStorageWorkbenchLayoutStore(LAYOUT_STORE_KEY);

export function App() {
  const plugins = useMemo(() => createPlugins(), []);
  const mountExternalHosts = useMemo(() => {
    const sandbox = createSandboxExtensionHost({
      permission: 'edit',
      preferInProcess: true,
      manifests: [seatingManifest, saveTheDateManifest],
      grants: [
        {
          id: 'wm.seating',
          kind: 'widget',
          source: seatingSource,
          capabilities: ['widget:render', 'widget:values'],
          allowedCommands: ['wm.seating.insert'],
          title: 'Seating',
        },
        {
          id: 'wm.save-the-date',
          kind: 'widget',
          source: saveTheDateSource,
          capabilities: ['widget:render', 'widget:values'],
          allowedCommands: ['wm.save-the-date.insert'],
          title: 'Save the date',
        },
      ],
    });

    return (api: WorkbenchApi) => {
      const disposeSandbox = mountSandboxExtensions(api, sandbox);
      void sandbox.pushWidgetSource('wm.seating', seatingSource);
      void sandbox.pushWidgetSource('wm.save-the-date', saveTheDateSource);

      if (!isEmbedMode()) {
        return disposeSandbox;
      }

      const panel = new EmbedPanelHost({
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
      });
      const disposeEmbed = mountEmbedPanel(api, panel);
      return () => {
        disposeEmbed();
        disposeSandbox();
      };
    };
  }, []);

  return (
    <div className="canvas-demo-app">
      <WorkbenchShell
        className="canvas-workbench"
        createPropertyHostContext={createCanvasPropertyHostContextWithApi}
        editorTitle="Canvas"
        editorUri="openworkbench://canvas-demo"
        initialScene={createCanvasDemoScene()}
        layout={DEFAULT_CANVAS_LAYOUT}
        layoutStore={layoutStore}
        mountExternalHosts={mountExternalHosts}
        onOpenDocument={async () => promptUri('Open document URI') ?? undefined}
        onSaveAs={async () =>
          promptUri('Save as URI', 'openworkbench://canvas-demo') ?? undefined
        }
        plugins={plugins}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-demo-app { height: 100%; display: flex; flex-direction: column; }
        .canvas-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
