import type { OverlayDescriptor } from '@openenvx/headless';

import { useWorkbenchContext } from '../context/workbench-context';
import { Button } from '../primitives/button';

import styles from './overlay.module.css';

interface Props {
  overlays: OverlayDescriptor[];
}

export function OverlayRenderer({ overlays }: Props) {
  const { executeCommand } = useWorkbenchContext();
  const visible = overlays.filter((overlay) => overlay.visible);

  if (visible.length === 0) {
    return null;
  }

  return (
    <>
      {visible.map((overlay) => (
        <div className={styles.backdrop} key={overlay.id} role="presentation">
          <div aria-modal="true" className={styles.dialog} role="dialog">
            <h3 className={styles.title}>{overlay.title}</h3>
            {overlay.content.kind === 'text' ? (
              <p className={styles.text}>{overlay.content.text}</p>
            ) : null}
            {overlay.content.kind === 'command-list' ? (
              <div className={styles.commands}>
                {overlay.content.commandIds.map((commandId) => (
                  <Button
                    key={commandId}
                    onClick={() => executeCommand(commandId)}
                    size="sm"
                  >
                    {commandId}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </>
  );
}
