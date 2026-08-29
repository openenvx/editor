import type { Scene as CoreScene } from '@openenvx/core/schema';
import {
  createHtmlDemoScene,
  DEFAULT_HTML_LAYOUT,
  HtmlBlocksPlugin,
} from '@openenvx/html';
import { WorkbenchShell } from '@openenvx/workbench';
import { useMemo } from 'react';

import './theme.css';

const HTML_EDITOR_PLUGINS = [new HtmlBlocksPlugin()];

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
      layout={DEFAULT_HTML_LAYOUT}
      locale={locale}
      onSceneChange={onChange}
      plugins={HTML_EDITOR_PLUGINS}
      theme={theme}
    />
  );
}
