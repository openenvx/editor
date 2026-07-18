import styles from './version-panel.module.css';

export function VersionPanel() {
  return (
    <div className={styles.root}>
      <p className={styles.title}>Version history</p>
      <p className={styles.body}>
        Coming soon — document versions will appear here.
      </p>
    </div>
  );
}
