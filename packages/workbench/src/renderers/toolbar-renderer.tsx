import { ContextKeyServiceId } from '@openenvx/core';
import type {
  ToolbarItemDescriptor,
  ToolbarPlacement,
} from '@openenvx/headless';
import { isToolbarDropdownItem } from '@openenvx/headless';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useContextKeysRevision } from '../hooks/use-context-key';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { IconButton } from '../primitives/icon-button';
import { ShellDropdownControl } from './shell-dropdown-control';

import styles from './toolbar.module.css';

export interface ToolbarRendererProps {
  items: ToolbarItemDescriptor[];
  placement: ToolbarPlacement;
}

export const ToolbarRenderer = memo(
  ({ items, placement }: ToolbarRendererProps) => {
    const { api, executeCommand } = useWorkbenchContext();
    const commandStates = useWorkbenchContextSelector(
      (state) => state.commandStates
    );
    useContextKeysRevision();
    const { t } = useWorkbenchTranslation();
    const contextKeys = api.getService(ContextKeyServiceId);

    const placementItems = useMemo(
      () => items.filter((item) => item.placement === placement),
      [items, placement]
    );

    if (placementItems.length === 0) {
      return null;
    }

    return (
      <div className={styles.toolbar} data-owb-editor-toolbar={placement}>
        {placementItems.map((item) => {
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
                placement={placement}
                variant="toolbar"
              />
            );
          }

          const canExecute =
            commandStates?.[item.commandId]?.canExecute ?? true;
          const label = t(item.labelKey);
          const active = item.toggledWhen
            ? (contextKeys?.evaluate(item.toggledWhen) ?? false)
            : false;

          return (
            <IconButton
              active={active}
              aria-label={label}
              aria-pressed={item.toggledWhen ? active : undefined}
              disabled={!canExecute}
              key={item.id}
              title={label}
              onClick={() => void executeCommand(item.commandId, item.args)}
            >
              <WorkbenchIcon id={item.icon} size={14} />
            </IconButton>
          );
        })}
      </div>
    );
  }
);
