import { CanvasEditor, type Scene } from '@openenvx/canvas-studio';
import { createCanvasScene } from '@openenvx/canvas-studio/runtime';
import { exportCanvasDocument } from '@openenvx/canvas/export';
import { downloadBytes } from '@openenvx/canvas/export-bytes';
import { getActivePage } from '@openenvx/core';
import type { Scene as CoreScene } from '@openenvx/core/schema';
import { useCallback, useMemo, useState } from 'react';

import '@openenvx/canvas-studio/theme.css';
import '@openenvx/canvas-studio/fonts.css';

type ExportFormat = 'png' | 'jpg';

export function App() {
  const initialScene = useMemo(() => createCanvasScene(), []);
  const [scene, setScene] = useState<Scene>(initialScene);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const onChange = useCallback((next: Scene) => {
    setScene(next);
  }, []);

  const exportPage = useCallback(
    async (format: ExportFormat) => {
      const coreScene = scene as unknown as CoreScene;
      const page = getActivePage(coreScene);
      setExporting(format);
      setExportError(null);
      try {
        const result = await exportCanvasDocument(coreScene, page.id, {
          format,
        });
        const extension = format === 'jpg' ? 'jpg' : 'png';
        downloadBytes(
          result.data,
          result.mimeType,
          result.fileName ?? `artboard.${extension}`
        );
      } catch (error) {
        setExportError(
          error instanceof Error ? error.message : 'Export failed'
        );
      } finally {
        setExporting(null);
      }
    },
    [scene]
  );

  return (
    <div className="canvas-package-demo">
      <header className="canvas-package-demo-bar">
        <span className="canvas-package-demo-label">
          @openenvx/canvas-studio
        </span>
        <div className="canvas-package-demo-actions">
          {exportError ? (
            <span className="canvas-package-demo-error">{exportError}</span>
          ) : null}
          <button
            disabled={exporting !== null}
            onClick={() => exportPage('png')}
            type="button"
          >
            {exporting === 'png' ? 'Exporting…' : 'Download PNG'}
          </button>
          <button
            disabled={exporting !== null}
            onClick={() => exportPage('jpg')}
            type="button"
          >
            {exporting === 'jpg' ? 'Exporting…' : 'Download JPG'}
          </button>
        </div>
      </header>
      <CanvasEditor
        className="canvas-package-demo-editor openenvx-canvas-editor"
        editorTitle="Artboard"
        initialScene={initialScene}
        onChange={onChange}
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
        .canvas-package-demo-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border-bottom: 1px solid #262626;
          color: #e5e5e5;
          font-family: system-ui, sans-serif;
          font-size: 13px;
        }
        .canvas-package-demo-label {
          opacity: 0.8;
        }
        .canvas-package-demo-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .canvas-package-demo-error {
          color: #f87171;
          max-width: 240px;
        }
        .canvas-package-demo-actions button {
          background: #171717;
          border: 1px solid #404040;
          border-radius: 6px;
          color: inherit;
          cursor: pointer;
          font: inherit;
          padding: 6px 10px;
        }
        .canvas-package-demo-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .canvas-package-demo-actions button:not(:disabled):hover {
          background: #262626;
        }
        .canvas-package-demo-editor { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
