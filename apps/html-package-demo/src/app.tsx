import type { Scene } from '@openenvx/core/schema';
import { HtmlEditor } from '@openenvx/html-driver/studio';
import { useCallback } from 'react';

import '@openenvx/html-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  const onChange = useCallback((scene: Scene) => {
    const rootLayers = scene.pages[0]?.layers.length ?? 0;
    console.log('[html-package-demo] root layers:', rootLayers);
  }, []);

  return (
    <div className="html-package-demo">
      <HtmlEditor
        className="html-package-demo-editor openenvx-html-editor"
        editorTitle="Block page"
        onChange={onChange}
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
