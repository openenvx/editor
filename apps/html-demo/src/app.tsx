import {
  DEFAULT_HTML_STUDIO_PLUGINS,
  WorkbenchShell,
  createHtmlDemoScene,
  DEFAULT_WORKBENCH_LAYOUT,
} from '@xmazu/openenvxee-html-studio';

import '@xmazu/openenvxee-html-studio/theme.css';

export function App() {
  return (
    <div className="html-demo-app">
      <WorkbenchShell
        className="html-workbench"
        editorTitle="Website"
        editorUri="openworkbench://html-demo"
        initialScene={createHtmlDemoScene()}
        layout={DEFAULT_WORKBENCH_LAYOUT}
        plugins={DEFAULT_HTML_STUDIO_PLUGINS}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .html-demo-app { height: 100%; display: flex; flex-direction: column; }
        .html-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
