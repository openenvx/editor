import { defaultCanvasWorkbench } from '@openenvx/canvas-driver';
import type { Scene as CoreScene } from '@openenvx/studio/schema';
import { WorkbenchShell } from '@openenvx/studio/shell';
import { useMemo } from 'react';

import { canvasPackageDemoExportPlugin } from './canvas-package-demo-export-plugin';
import { createVariableTemplateDemoScene } from './create-variable-template-demo-scene';

import '@openenvx/canvas-driver/fonts.css';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  const initialScene = useMemo(() => createVariableTemplateDemoScene(), []);
  const plugins = useMemo(
    () => [...defaultCanvasWorkbench.plugins, canvasPackageDemoExportPlugin],
    []
  );

  return (
    <div className="canvas-package-demo">
      <WorkbenchShell
        className="canvas-package-demo-editor openenvx-canvas-editor"
        createPropertyHostContext={
          defaultCanvasWorkbench.createPropertyHostContext
        }
        editorTitle="Artboard"
        editorUri="openenvx://canvas/editor"
        initialScene={initialScene as unknown as CoreScene}
        layout={defaultCanvasWorkbench.layout}
        plugins={plugins}
        theme="dark"
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .canvas-package-demo {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #101010;
        }
        .canvas-package-demo-editor { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
