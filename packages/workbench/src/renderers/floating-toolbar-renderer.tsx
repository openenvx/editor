import type { ToolbarItemDescriptor } from '@openenvx/headless';
import { isToolbarDropdownItem } from '@openenvx/headless';
import { memo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { IconButton } from '../primitives/icon-button';
import { ShellDropdownControl } from './shell-dropdown-control';

import styles from '../layout/floating-toolbar.module.css';

interface FloatingToolbarRendererProps {
  items: ToolbarItemDescriptor[];
}

export const FloatingToolbarRenderer = memo(
  ({ items }: FloatingToolbarRendererProps) => {
    const { executeCommand } = useWorkbenchContext();
    const commandStates = useWorkbenchContextSelector(
      (state) => state.commandStates
    );
    const { t } = useWorkbenchTranslation();

    if (items.length === 0) {
      return null;
    }

    return (
      <div className={styles.toolbar}>
        {items.map((item) => {
          if (item.kind === 'separator') {
            return <span className={styles.divider} key={item.id} />;
          }

          if (isToolbarDropdownItem(item)) {
            return (
              <ShellDropdownControl
                id={item.id}
                items={item.items}
                key={item.id}
                label={item.label}
                labelBinding={item.labelBinding}
                labelKey={item.labelKey}
                labelSuffix={item.labelSuffix}
                variant="toolbar"
              />
            );
          }

          const canExecute =
            commandStates?.[item.commandId]?.canExecute ?? true;
          const label = t(item.labelKey);

          return (
            <IconButton
              aria-label={label}
              disabled={!canExecute}
              key={item.id}
              onClick={() => void executeCommand(item.commandId)}
              title={label}
            >
              <WorkbenchIcon id={item.icon} size={16} />
            </IconButton>
          );
        })}
      </div>
    );
  }
);
