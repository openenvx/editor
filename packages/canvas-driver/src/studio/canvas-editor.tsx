import { WorkbenchShell } from '@openenvx/studio';
import type { Plugin } from '@openenvx/studio/core';
import type { Scene as CoreScene } from '@openenvx/studio/schema';
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
  /** Extra workbench plugins merged after the default canvas studio plugins. */
  plugins?: Plugin[];
}

export function CanvasEditor({
  initialScene,
  onChange,
  theme = 'dark',
  className,
  editorTitle,
  locale,
  plugins: extraPlugins,
}: CanvasEditorProps) {
  const scene = useMemo(
    () => initialScene ?? (createCanvasDemoScene() as unknown as Scene),
    [initialScene]
  );

  const plugins = useMemo(
    () => [...defaultCanvasStudio.plugins, ...(extraPlugins ?? [])],
    [extraPlugins]
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
      plugins={plugins}
      theme={theme}
    />
  );
}
