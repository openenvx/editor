import type { OverlayDescriptor } from '@openenvx/headless';

import { useWorkbenchContext } from '../context/workbench-context';
import { usePresence } from '../hooks/use-presence';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';

import overlaySurface from '../primitives/overlay-surface.module.css';
import styles from './overlay.module.css';

interface Props {
  overlays: OverlayDescriptor[];
}

function OverlayItem({ overlay }: { overlay: OverlayDescriptor }) {
  const { executeCommand } = useWorkbenchContext();
  const { present, state } = usePresence(overlay.visible);

  if (!present) {
    return null;
  }

  return (
    <div
      className={cn(styles.backdrop, overlaySurface.backdrop)}
      data-state={state}
      role="presentation"
    >
      <div
        aria-modal="true"
        className={cn(styles.dialog, overlaySurface.surface)}
        data-state={state}
        role="dialog"
      >
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
  );
}

export function OverlayRenderer({ overlays }: Props) {
  return (
    <>
      {overlays.map((overlay) => (
        <OverlayItem key={overlay.id} overlay={overlay} />
      ))}
    </>
  );
}
