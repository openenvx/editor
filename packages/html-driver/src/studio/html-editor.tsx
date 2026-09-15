import type { Scene as CoreScene } from '@openenvx/core/schema';
import { WorkbenchShell } from '@openenvx/studio';
import { useMemo } from 'react';

import { createHtmlDemoScene } from '../create-html-demo-scene';
import { defaultHtmlStudio } from './default-html-studio';

export interface HtmlEditorProps {
  /** Initial document. Defaults to a starter block page when omitted. */
  initialScene?: CoreScene;
  /** Called when scene content changes (undo/redo, edits, template load). */
  onChange?: (scene: CoreScene) => void;
  theme?: 'light' | 'dark' | string;
  className?: string;
  editorTitle?: string;
  locale?: string;
}

export function HtmlEditor({
  initialScene,
  onChange,
  theme = 'dark',
  className,
  editorTitle,
  locale,
}: HtmlEditorProps) {
  const scene = useMemo(
    () => initialScene ?? createHtmlDemoScene(),
    [initialScene]
  );

  const shellClassName = ['openenvx-html-editor', className]
    .filter(Boolean)
    .join(' ');

  return (
    <WorkbenchShell
      className={shellClassName}
      editorTitle={editorTitle}
      editorUri="openenvx://html/editor"
      initialScene={scene}
      layout={defaultHtmlStudio.layout}
      locale={locale}
      onSceneChange={onChange}
      plugins={defaultHtmlStudio.plugins}
      theme={theme}
    />
  );
}
