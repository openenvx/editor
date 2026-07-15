import type { FieldAction } from '@openenvx/core';

import { WorkbenchIcon } from '../icons/workbench-icon';
import { IconButton } from '../primitives/icon-button';

import styles from '../primitives/inspector-field.module.css';

export interface FieldActionsRowProps {
  actions: FieldAction[];
  layerData: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onCommand: (commandId: string) => void;
}

export function FieldActionsRow({
  actions,
  layerData,
  onUpdate,
  onCommand,
}: FieldActionsRowProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      {actions.map((action) => (
        <IconButton
          aria-label={action.label}
          className={styles.iconAction}
          key={`${action.icon}-${action.label}`}
          onClick={() => {
            const click = action.onClick;
            if (click.type === 'setValue') {
              onUpdate(click.key, click.value);
              return;
            }
            if (click.type === 'toggle') {
              onUpdate(click.key, !layerData[click.key]);
              return;
            }
            onCommand(click.commandId);
          }}
          size="sm"
        >
          <WorkbenchIcon id={action.icon} size={12} />
        </IconButton>
      ))}
    </>
  );
}
