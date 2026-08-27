import {
  CanvasPlugin,
  createCanvasDemoScene,
  createCanvasPropertyHostContextWithApi,
  DEFAULT_CANVAS_LAYOUT,
} from '@openenvx/canvas';
import type { Scene as CoreScene } from '@openenvx/core/schema';
import { WorkbenchShell } from '@openenvx/workbench';
import { useMemo } from 'react';

import type { Scene } from './scene';

import './theme.css';

const CANVAS_EDITOR_PLUGINS = [new CanvasPlugin()];

export interface CanvasEditorProps {
  /** Initial document. Defaults to a blank artboard when omitted. */
  initialScene?: Scene;
  /** Called when scene content changes (undo/redo, edits, template load). */
  onChange?: (scene: Scene) => void;
  theme?: 'light' | 'dark' | string;
  className?: string;
  editorTitle?: string;
  locale?: string;
}

export function CanvasEditor({
  initialScene,
  onChange,
  theme = 'dark',
  className,
  editorTitle,
  locale,
}: CanvasEditorProps) {
  const scene = useMemo(
    () => initialScene ?? (createCanvasDemoScene() as unknown as Scene),
    [initialScene]
  );

  const shellClassName = ['openenvx-canvas-editor', className]
    .filter(Boolean)
    .join(' ');

  return (
    <WorkbenchShell
      className={shellClassName}
      createPropertyHostContext={createCanvasPropertyHostContextWithApi}
      editorTitle={editorTitle}
      editorUri="openenvx://canvas/editor"
      initialScene={scene as unknown as CoreScene}
      layout={DEFAULT_CANVAS_LAYOUT}
      locale={locale}
      onSceneChange={
        onChange
          ? (next) => {
              onChange(next as unknown as Scene);
            }
          : undefined
      }
      plugins={CANVAS_EDITOR_PLUGINS}
      theme={theme}
    />
  );
}
