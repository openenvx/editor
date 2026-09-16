import { WorkbenchShell } from '@openenvx/studio';
import type { Scene as CoreScene } from '@openenvx/studio/schema';
import { useMemo } from 'react';

import { createEmailDemoScene } from '../create-email-demo-scene';
import { defaultEmailStudio } from './default-email-studio';
import type { Scene } from './scene';

export interface EmailEditorProps {
  /** Initial document. Defaults to a welcome-email starter when omitted. */
  initialScene?: Scene;
  /** Called when scene content changes (undo/redo, edits, template load). */
  onChange?: (scene: Scene) => void;
  theme?: 'light' | 'dark' | string;
  className?: string;
  editorTitle?: string;
  locale?: string;
}

export function EmailEditor({
  initialScene,
  onChange,
  theme = 'dark',
  className,
  editorTitle,
  locale,
}: EmailEditorProps) {
  const scene = useMemo(
    () => initialScene ?? createEmailDemoScene(),
    [initialScene]
  );

  const shellClassName = ['openenvx-email-editor', className]
    .filter(Boolean)
    .join(' ');

  return (
    <WorkbenchShell
      className={shellClassName}
      editorTitle={editorTitle}
      editorUri="openenvx://email/editor"
      initialScene={scene as CoreScene}
      layout={defaultEmailStudio.layout}
      locale={locale}
      onSceneChange={
        onChange
          ? (next) => {
              onChange(next as unknown as Scene);
            }
          : undefined
      }
      plugins={defaultEmailStudio.plugins}
      theme={theme}
    />
  );
}
