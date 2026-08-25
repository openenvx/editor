import type { Scene } from '@openenvx/core/schema';
import {
  EmailBlocksPlugin,
  createEmailScene,
  DEFAULT_EMAIL_LAYOUT,
} from '@openenvx/driver-email';
import { WorkbenchShell } from '@openenvx/workbench';
import { useMemo } from 'react';

import './theme.css';

const EMAIL_EDITOR_PLUGINS = [new EmailBlocksPlugin()];

/** Drop-in host layout: artboard overlay toolbars, no product top bar. */
const EMAIL_EDITOR_LAYOUT = {
  ...DEFAULT_EMAIL_LAYOUT,
  editorToolbars: true,
  topBar: false,
};

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

  const shellClassName = ['openenvx-email-editor', className]
    .filter(Boolean)
    .join(' ');

  return (
    <WorkbenchShell
      className={shellClassName}
      editorTitle={editorTitle}
      editorUri="openenvx://email/editor"
      initialScene={scene}
      layout={EMAIL_EDITOR_LAYOUT}
      locale={locale}
      onSceneChange={onChange}
      plugins={EMAIL_EDITOR_PLUGINS}
      theme={theme}
    />
  );
}
