import type { Scene } from '@openenvx/core/schema';
import { EmailBlocksPlugin, createEmailScene } from '@openenvx/driver-email';
import { DEFAULT_HTML_LAYOUT } from '@openenvx/html';
import { WorkbenchShell } from '@openenvx/workbench';
import { useMemo } from 'react';

import './theme.css';

const DEFAULT_EMAIL_PLUGINS = [new EmailBlocksPlugin()];

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
    () => initialScene ?? createEmailScene(),
    [initialScene]
  );

  return (
    <WorkbenchShell
      className={className}
      editorTitle={editorTitle}
      editorUri="openenvx://email/editor"
      initialScene={scene}
      layout={DEFAULT_HTML_LAYOUT}
      locale={locale}
      onSceneChange={onChange}
      plugins={DEFAULT_EMAIL_PLUGINS}
      theme={theme}
    />
  );
}
