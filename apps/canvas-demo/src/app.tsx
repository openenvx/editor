import {
  DEFAULT_AGENT_PLUGINS,
  AGENT_CHAT_CONTAINER_ID,
  ChatPanel,
} from '@openenvx/agent';
import { CanvasBasicsPlugin, createCanvasDemoScene } from '@openenvx/canvas';
import { DriverImagePlugin } from '@openenvx/driver-image';
import {
  createCanvasInspectorHostContextWithApi,
  DEFAULT_CANVAS_LAYOUT,
  DEFAULT_CANVAS_PRO_PLUGINS,
} from '@xmazu/openenvxee-canvas-pro';
import { WorkbenchShell } from '@xmazu/openenvxee-studio';

import { CanvasDemoChromePlugin } from './plugins/canvas-demo-chrome-plugin';
import { CanvasDemoPlugin } from './plugins/canvas-demo-plugin';

import '@openenvx/canvas/fonts.css';
import '@openenvxee/studio/theme.css';

const plugins = [
  new CanvasBasicsPlugin(),
  new DriverImagePlugin(),
  ...DEFAULT_CANVAS_PRO_PLUGINS,
  ...DEFAULT_AGENT_PLUGINS,
  new CanvasDemoPlugin(),
  new CanvasDemoChromePlugin(),
];

function promptUri(message: string, defaultValue?: string): string | null {
  // Demo-only input; production apps should replace with a proper dialog.
  // eslint-disable-next-line no-alert
  return window.prompt(message, defaultValue);
}

export function App() {
  return (
    <div className="canvas-demo-app">
      <WorkbenchShell
        className="canvas-workbench"
        createInspectorHostContext={createCanvasInspectorHostContextWithApi}
        editorTitle="Canvas"
        editorUri="openworkbench://canvas-demo"
        initialScene={createCanvasDemoScene()}
        layout={DEFAULT_CANVAS_LAYOUT}
        onOpenDocument={async () => promptUri('Open document URI') ?? undefined}
        onSaveAs={async () =>
          promptUri('Save as URI', 'openworkbench://canvas-demo') ?? undefined
        }
        plugins={plugins}
        sidebarPanels={{ [AGENT_CHAT_CONTAINER_ID]: ChatPanel }}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-demo-app { height: 100%; display: flex; flex-direction: column; }
        .canvas-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
