'use client';

import {
  createCanvasScene,
  createDefaultCanvasWorkbench,
} from '@openenvx/canvas-driver';
import { WorkbenchShell } from '@openenvx/studio/shell';
import { useMemo } from 'react';

export function CanvasNextDemoEditor() {
  const workbench = useMemo(
    () =>
      createDefaultCanvasWorkbench({
        document: createCanvasScene(),
        editorTitle: 'Artboard',
        editorUri: 'openenvx://canvas/next-demo',
      }),
    []
  );

  return (
    <div className="canvas-next-demo">
      <WorkbenchShell
        className="canvas-next-demo-editor openenvx-canvas-editor"
        createPropertyHostContext={workbench.createPropertyHostContext}
        layout={workbench.layout}
        plugins={workbench.plugins}
        sliceBuilders={workbench.sliceBuilders}
        theme="dark"
      />
      <style>{`
        .canvas-next-demo {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #101010;
        }
        .canvas-next-demo-editor {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </div>
  );
}
