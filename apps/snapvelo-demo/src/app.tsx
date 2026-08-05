import {
  DEFAULT_HTML_LAYOUT,
  DEFAULT_HTML_STUDIO_PLUGINS,
  HtmlPreviewChromeServiceId,
  WorkbenchShell,
  type WorkbenchApi,
  type WorkbenchLayout,
} from '@openenvx/html-studio';
import {
  createSnapveloEventScene,
  EVENT_PAGE_LAYER_ID,
  SnapveloEventPagePlugin,
} from '@openenvx/snapvelo';
import { useMemo } from 'react';

import '@openenvx/html-studio/theme.css';

// Debug: keep Blocks + Layers visible until on-canvas select/replace is solid.
const SNAPVELO_LAYOUT: WorkbenchLayout = {
  ...DEFAULT_HTML_LAYOUT,
  activityBar: true,
  primarySidebar: true,
  secondarySidebar: true,
};

const PLUGINS = [...DEFAULT_HTML_STUDIO_PLUGINS, new SnapveloEventPagePlugin()];

export function App() {
  const mountExternalHosts = useMemo(
    () => (api: WorkbenchApi) => {
      api.selectLayers([EVENT_PAGE_LAYER_ID], EVENT_PAGE_LAYER_ID);
      api.getService(HtmlPreviewChromeServiceId)?.seedPreset('desktop');
      return () => {};
    },
    []
  );

  return (
    <div className="snapvelo-demo-app">
      <WorkbenchShell
        className="snapvelo-workbench"
        editorTitle="Event page"
        editorUri="openworkbench://snapvelo-demo/event"
        initialScene={createSnapveloEventScene()}
        layout={SNAPVELO_LAYOUT}
        mountExternalHosts={mountExternalHosts}
        plugins={PLUGINS}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .snapvelo-demo-app { height: 100%; display: flex; flex-direction: column; }
        .snapvelo-workbench { flex: 1; min-height: 0; }
        /* Fallback when event page does not cover the artboard edge. */
        .snapvelo-workbench [data-testid="html-artboard"] > * {
          background: #f5f0e8 !important;
        }
      `}</style>
    </div>
  );
}
