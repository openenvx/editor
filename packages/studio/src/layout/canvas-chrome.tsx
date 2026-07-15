import type { ReactNode } from 'react';

import styles from './canvas-chrome.module.css';

export interface CanvasChromeProps {
  children: ReactNode;
  floatingToolbar?: ReactNode;
}

export function CanvasChrome({ children, floatingToolbar }: CanvasChromeProps) {
  return (
    <div className={styles.chrome}>
      <div className={styles.content}>{children}</div>
      {floatingToolbar ? (
        <div className={styles.floatingToolbar}>{floatingToolbar}</div>
      ) : null}
    </div>
  );
}
