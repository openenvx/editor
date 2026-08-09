import type { ToolbarPlacement } from '@openenvx/core';
import { TOOLBAR_PLACEMENTS } from '@openenvx/core';
import type { ReactNode } from 'react';

import styles from './editor-chrome.module.css';

export type EditorChromeToolbars = Partial<Record<ToolbarPlacement, ReactNode>>;

export interface EditorChromeProps {
  children: ReactNode;
  toolbars?: EditorChromeToolbars;
}

const PLACEMENT_CLASS: Record<ToolbarPlacement, string> = {
  'bottom-center': styles.bottomCenter,
  'bottom-left': styles.bottomLeft,
  'bottom-right': styles.bottomRight,
  'top-center': styles.topCenter,
  'top-left': styles.topLeft,
  'top-right': styles.topRight,
};

export function EditorChrome({ children, toolbars }: EditorChromeProps) {
  return (
    <div className={styles.chrome}>
      <div className={styles.content}>{children}</div>
      {TOOLBAR_PLACEMENTS.map((placement) => {
        const node = toolbars?.[placement];
        if (!node) {
          return null;
        }
        return (
          <div
            className={[styles.slot, PLACEMENT_CLASS[placement]].join(' ')}
            key={placement}
          >
            {node}
          </div>
        );
      })}
    </div>
  );
}
