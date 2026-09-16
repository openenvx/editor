import { createCanvasScene } from '@openenvx/canvas-driver/runtime';
import { CanvasEditor } from '@openenvx/canvas-driver/studio';
import { useMemo } from 'react';

import { canvasPackageDemoExportPlugin } from './canvas-package-demo-export-plugin';

import '@openenvx/canvas-driver/fonts.css';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  const initialScene = useMemo(() => createCanvasScene(), []);
  const demoPlugins = useMemo(() => [canvasPackageDemoExportPlugin], []);

  return (
    <div className="canvas-package-demo">
      <CanvasEditor
        className="canvas-package-demo-editor openenvx-canvas-editor"
        editorTitle="Artboard"
        initialScene={initialScene}
        plugins={demoPlugins}
        theme="dark"
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-package-demo {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
        }
        .canvas-package-demo-editor { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
