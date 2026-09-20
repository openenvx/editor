'use client';

import {
  createCanvasScene,
  defaultCanvasWorkbench,
} from '@openenvx/canvas-driver';
import { WorkbenchShell } from '@openenvx/studio';
import type { Scene as CoreScene } from '@openenvx/studio/schema';
import { useMemo } from 'react';

export function CanvasNextDemoEditor() {
  const initialScene = useMemo(() => createCanvasScene(), []);

  return (
    <div className="canvas-next-demo">
      <WorkbenchShell
        className="canvas-next-demo-editor openenvx-canvas-editor"
        createPropertyHostContext={
          defaultCanvasWorkbench.createPropertyHostContext
        }
        editorTitle="Artboard"
        editorUri="openenvx://canvas/next-demo"
        initialScene={initialScene as unknown as CoreScene}
        layout={defaultCanvasWorkbench.layout}
        plugins={defaultCanvasWorkbench.plugins}
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
