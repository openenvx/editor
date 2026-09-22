import { createHtmlScene, defaultHtmlWorkbench } from '@openenvx/html-driver';
import type { Scene } from '@openenvx/studio/schema';
import { WorkbenchShell } from '@openenvx/studio/shell';
import { useCallback, useMemo } from 'react';

import '@openenvx/html-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  const initialScene = useMemo(() => createHtmlScene(), []);
  const plugins = useMemo(() => defaultHtmlWorkbench.plugins, []);

  const onSceneChange = useCallback((scene: Scene) => {
    const rootLayers = scene.artboards[0]?.nodes.length ?? 0;
    console.log('[html-package-demo] root layers:', rootLayers);
  }, []);

  return (
    <div className="html-package-demo">
      <WorkbenchShell
        className="html-package-demo-editor openenvx-html-editor"
        editorTitle="Block page"
        editorUri="openenvx://html/editor"
        initialScene={initialScene}
        layout={defaultHtmlWorkbench.layout}
        onSceneChange={onSceneChange}
        plugins={plugins}
        theme="dark"
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .html-package-demo { height: 100%; display: flex; flex-direction: column; }
        .html-package-demo-editor { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
