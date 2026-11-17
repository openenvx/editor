import { createDefaultCanvasWorkbench } from '@openenvx/canvas-driver';
import { WorkbenchShell } from '@openenvx/studio/shell';
import { useMemo } from 'react';

import { canvasPackageDemoExportPlugin } from './canvas-package-demo-export-plugin';
import { createVariableTemplateDemoScene } from './create-variable-template-demo-scene';

import '@openenvx/canvas-driver/fonts.css';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/studio/styles.css';

export function App() {
  const workbench = useMemo(
    () =>
      createDefaultCanvasWorkbench({
        document: createVariableTemplateDemoScene(),
        editorTitle: 'Artboard',
        editorUri: 'openenvx://canvas/editor',
      }),
    []
  );
  const plugins = useMemo(
    () => [...workbench.plugins, canvasPackageDemoExportPlugin],
    [workbench.plugins]
  );

  return (
    <div className="canvas-package-demo">
      <WorkbenchShell
        className="canvas-package-demo-editor openenvx-canvas-editor"
        createPropertyHostContext={workbench.createPropertyHostContext}
        layout={workbench.layout}
        plugins={plugins}
        sliceBuilders={workbench.sliceBuilders}
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
