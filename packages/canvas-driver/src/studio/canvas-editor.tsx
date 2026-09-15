import type { Scene as CoreScene } from '@openenvx/core/schema';
import { WorkbenchShell } from '@openenvx/studio';
import { useMemo } from 'react';

import { createCanvasDemoScene } from '../plugin/canvas-plugin';
import { defaultCanvasStudio } from './default-canvas-studio';
import type { Scene } from './scene';

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
      createPropertyHostContext={defaultCanvasStudio.createPropertyHostContext}
      editorTitle={editorTitle}
      editorUri="openenvx://canvas/editor"
      initialScene={scene as unknown as CoreScene}
      layout={defaultCanvasStudio.layout}
      locale={locale}
      onSceneChange={
        onChange
          ? (next) => {
              onChange(next as unknown as Scene);
            }
          : undefined
      }
      plugins={defaultCanvasStudio.plugins}
      theme={theme}
    />
  );
}
