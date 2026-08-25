import type { Scene } from '@openenvx/core/schema';
import {
  EmailBlocksPlugin,
  EmailTopBar,
  createEmailScene,
  DEFAULT_EMAIL_LAYOUT,
} from '@openenvx/driver-email';
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
  /** When set, the top bar shows a back control that calls this handler. */
  onBack?: () => void;
}

export function EmailEditor({
  initialScene,
  onChange,
  theme = 'dark',
  className,
  editorTitle,
  locale,
  onBack,
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
      layout={DEFAULT_EMAIL_LAYOUT}
      locale={locale}
      onSceneChange={onChange}
      plugins={DEFAULT_EMAIL_PLUGINS}
      theme={theme}
      topBar={<EmailTopBar onBack={onBack} />}
    />
  );
}
