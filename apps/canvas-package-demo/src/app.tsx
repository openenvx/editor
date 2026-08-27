import { CanvasEditor } from '@openenvx/canvas-studio';
import { createCanvasScene } from '@openenvx/canvas-studio/runtime';

import '@openenvx/canvas-studio/theme.css';
import '@openenvx/canvas-studio/fonts.css';

export function App() {
  return (
    <div className="canvas-package-demo">
      <CanvasEditor
        className="canvas-package-demo-editor openenvx-canvas-editor"
        editorTitle="Artboard"
        initialScene={createCanvasScene()}
        theme="dark"
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-package-demo { height: 100%; display: flex; flex-direction: column; }
        .canvas-package-demo-editor { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
