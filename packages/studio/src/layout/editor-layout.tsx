import type { ReactNode } from 'react';

import styles from './editor-layout.module.css';

export interface EditorLayoutProps {
  topBar?: ReactNode;
  primarySidebar?: ReactNode;
  editor?: ReactNode;
  secondarySidebar?: ReactNode;
  statusBar?: ReactNode;
}

export function EditorLayout({
  topBar,
  primarySidebar,
  editor,
  secondarySidebar,
  statusBar,
}: EditorLayoutProps) {
  return (
    <div className={styles.root}>
      {topBar ? <header className={styles.topBar}>{topBar}</header> : null}
      <div className={styles.body}>
        {primarySidebar ? (
          <aside className={styles.primarySidebar}>{primarySidebar}</aside>
        ) : null}
        {editor ? <main className={styles.editor}>{editor}</main> : null}
        {secondarySidebar ? (
          <aside className={styles.secondarySidebar}>{secondarySidebar}</aside>
        ) : null}
      </div>
      {statusBar ? (
        <footer className={styles.statusBar}>{statusBar}</footer>
      ) : null}
    </div>
  );
}
