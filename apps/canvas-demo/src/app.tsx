import {
  AGENT_CHAT_CONTAINER_ID,
  ChatPanel,
  DEFAULT_STUDIO_PLUGINS,
  TEMPLATE_DATA_CONTAINER_ID,
  TemplateDataPanel,
  WorkbenchShell,
  createCanvasDemoScene,
  createCanvasInspectorHostContextWithApi,
  DEFAULT_CANVAS_LAYOUT,
} from '@xmazu/openenvxee-studio';

import { CanvasDemoChromePlugin } from './plugins/canvas-demo-chrome-plugin';
import { CanvasDemoPlugin } from './plugins/canvas-demo-plugin';
import { CanvasDemoVersionPlugin } from './plugins/canvas-demo-version-plugin';

import '@xmazu/openenvxee-studio/fonts.css';
import '@xmazu/openenvxee-studio/theme.css';

const plugins = [
  ...DEFAULT_STUDIO_PLUGINS,
  new CanvasDemoPlugin(),
  new CanvasDemoChromePlugin(),
  new CanvasDemoVersionPlugin(),
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
        sidebarPanels={{
          [AGENT_CHAT_CONTAINER_ID]: ChatPanel,
          [TEMPLATE_DATA_CONTAINER_ID]: TemplateDataPanel,
        }}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-demo-app { height: 100%; display: flex; flex-direction: column; }
        .canvas-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
