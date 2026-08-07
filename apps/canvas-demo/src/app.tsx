import { createCanvasDemoScene } from '@openenvx/canvas';
import {
  DEFAULT_STUDIO_PLUGINS,
  VersionHistoryPlugin,
  WorkbenchShell,
  createCanvasPropertyHostContextWithApi,
  createLocalStorageWorkbenchLayoutStore,
  createPostMessagePluginPanelTransport,
  createSandboxExtensionHost,
  DEFAULT_CANVAS_LAYOUT,
  EmbedPanelHost,
  mountEmbedPanel,
  mountSandboxExtensions,
} from '@openenvx/canvas-studio';
import type { Plugin } from '@openenvx/core';
import type { WorkbenchApi } from '@openenvx/headless';
import saveTheDateSource from 'openenvx-widget:./extensions/save-the-date.widget.tsx';
import seatingSource from 'openenvx-widget:./extensions/seating.widget.tsx';
import { useMemo } from 'react';

import saveTheDateManifest from './extensions/save-the-date.extension';
import seatingManifest from './extensions/seating.extension';
import { CanvasDemoChromePlugin } from './plugins/canvas-demo-chrome-plugin';
import { CanvasDemoPlugin } from './plugins/canvas-demo-plugin';
import { createDemoVersionHistoryProvider } from './providers/demo-version-history-provider';

import '@openenvx/canvas-studio/fonts.css';
import '@openenvx/canvas-studio/theme.css';

const EMBED_PANEL_ID = 'embed.demo';
const LAYOUT_STORE_KEY = 'openenvx.canvas-demo.workbench-layout';

interface SandboxHot {
  pushWidgetSource: (id: string, source: string) => Promise<void>;
}

if (import.meta.hot) {
  import.meta.hot.accept(
    'openenvx-widget:./extensions/seating.widget.tsx',
    (mod) => {
      const source = (mod as { default?: string } | undefined)?.default;
      const sandbox = import.meta.hot?.data.sandbox as SandboxHot | undefined;
      if (source && sandbox) {
        void sandbox.pushWidgetSource('wm.seating', source);
      }
    }
  );
  import.meta.hot.accept(
    'openenvx-widget:./extensions/save-the-date.widget.tsx',
    (mod) => {
      const source = (mod as { default?: string } | undefined)?.default;
      const sandbox = import.meta.hot?.data.sandbox as SandboxHot | undefined;
      if (source && sandbox) {
        void sandbox.pushWidgetSource('wm.save-the-date', source);
      }
    }
  );
}

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

function preferSandboxInProcess(): boolean {
  const enabled = new URLSearchParams(window.location.search).has(
    'sandboxInProcess'
  );
  if (enabled) {
    console.warn(
      '[openenvx] ?sandboxInProcess=1 enables in-process QuickJS (test-only). Production hosts must use a Worker.'
    );
  }
  return enabled;
}

export function App() {
  const plugins = useMemo(() => createPlugins(), []);
  const mountExternalHosts = useMemo(() => {
    const sandbox = createSandboxExtensionHost({
      permission: 'edit',
      preferInProcess: preferSandboxInProcess(),
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
      if (import.meta.hot) {
        import.meta.hot.data.sandbox = sandbox;
      }
      void sandbox.pushWidgetSource('wm.seating', seatingSource);
      void sandbox.pushWidgetSource('wm.save-the-date', saveTheDateSource);

      if (!isEmbedMode()) {
        return () => {
          if (import.meta.hot) {
            import.meta.hot.data.sandbox = undefined;
          }
          disposeSandbox();
        };
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
        if (import.meta.hot) {
          import.meta.hot.data.sandbox = undefined;
        }
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
