import type { Scene as CoreScene } from '@openenvx/core/schema';
import { WorkbenchShell } from '@openenvx/workbench';
import { useMemo } from 'react';

import { createEmailDemoScene as createEmailScene } from '../../driver-email/src/create-email-demo-scene';
import { DEFAULT_EMAIL_LAYOUT } from '../../driver-email/src/default-email-layout';
import { EmailBlocksPlugin } from '../../driver-email/src/plugin/email-blocks-plugin';
import type { Scene } from './scene';

import './theme.css';

const EMAIL_EDITOR_PLUGINS = [new EmailBlocksPlugin({ topBar: true })];

/** Drop-in layout: top bar + bottom insert toolbar + inspector (no activity bar / left sidebar). */
const EMAIL_EDITOR_LAYOUT = {
  ...DEFAULT_EMAIL_LAYOUT,
  activityBar: false,
  primarySidebar: false,
  statusBar: false,
  editorToolbars: true,
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
      initialScene={scene as CoreScene}
      layout={EMAIL_EDITOR_LAYOUT}
      locale={locale}
      onSceneChange={
        onChange
          ? (next) => {
              onChange(next as unknown as Scene);
            }
          : undefined
      }
      plugins={EMAIL_EDITOR_PLUGINS}
      theme={theme}
    />
  );
}
