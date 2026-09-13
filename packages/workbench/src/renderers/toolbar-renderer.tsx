import {
  ContextKeyServiceId,
  isToolbarDropdownItem,
  type ToolbarCommandItemDescriptor,
  type ToolbarItemDescriptor,
  type ToolbarPlacement,
  type ToolbarSeparatorItemDescriptor,
} from '@openenvx/core';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useContextKeysRevision } from '../hooks/use-context-key';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { IconButton } from '../primitives/icon-button';
import { ShellDropdownControl } from './shell-dropdown-control';

import labelStyles from './toolbar-label-button.module.css';
import styles from './toolbar.module.css';

export interface ToolbarRendererProps {
  items: ToolbarItemDescriptor[];
  placement: ToolbarPlacement;
}

type ToolbarSection =
  | { kind: 'items'; items: ToolbarItemDescriptor[] }
  | { kind: 'separator'; item: ToolbarSeparatorItemDescriptor };

function splitToolbarSections(
  items: ToolbarItemDescriptor[]
): ToolbarSection[] {
  const sections: ToolbarSection[] = [];
  let buffer: ToolbarItemDescriptor[] = [];

  for (const item of items) {
    if (item.kind === 'separator') {
      if (buffer.length > 0) {
        sections.push({ kind: 'items', items: buffer });
        buffer = [];
      }
      sections.push({ kind: 'separator', item });
      continue;
    }
    buffer.push(item);
  }

  if (buffer.length > 0) {
    sections.push({ kind: 'items', items: buffer });
  }

  return sections;
}

function ToolbarItemNode({
  item,
  placement,
}: {
  item: ToolbarItemDescriptor;
  placement: ToolbarPlacement;
}) {
  const { api, executeCommand } = useWorkbenchContext();
  const commandStates = useWorkbenchContextSelector(
    (state) => state.commandStates
  );
  useContextKeysRevision();
  const { t } = useWorkbenchTranslation();
  const contextKeys = api.getService(ContextKeyServiceId);

  if (isToolbarDropdownItem(item)) {
    return (
      <ShellDropdownControl
        icon={item.icon}
        id={item.id}
        items={item.items}
        label={item.label}
        labelBinding={item.labelBinding}
        labelKey={item.labelKey}
        labelSuffix={item.labelSuffix}
        placement={placement}
        variant="toolbar"
      />
    );
  }

  const commandItem = item as ToolbarCommandItemDescriptor;
  const canExecute = commandStates?.[commandItem.commandId]?.canExecute ?? true;
  const label = commandItem.labelKey
    ? t(commandItem.labelKey)
    : (commandItem.label ?? '');
  const active = commandItem.toggledWhen
    ? (contextKeys?.evaluate(commandItem.toggledWhen) ?? false)
    : false;
  const presentation =
    commandItem.presentation ?? (commandItem.icon ? 'icon' : 'label');

  if (presentation === 'label') {
    return (
      <button
        aria-label={label}
        aria-pressed={commandItem.toggledWhen ? active : undefined}
        className={[labelStyles.button, active ? labelStyles.buttonActive : '']
          .filter(Boolean)
          .join(' ')}
        disabled={!canExecute}
        title={label}
        type="button"
        onClick={() =>
          void executeCommand(commandItem.commandId, commandItem.args)
        }
      >
        {label}
      </button>
    );
  }

  return (
    <IconButton
      active={active}
      aria-label={label}
      aria-pressed={commandItem.toggledWhen ? active : undefined}
      disabled={!canExecute}
      title={label}
      onClick={() =>
        void executeCommand(commandItem.commandId, commandItem.args)
      }
    >
      <WorkbenchIcon id={commandItem.icon ?? 'tools'} size={14} />
    </IconButton>
  );
}

export const ToolbarRenderer = memo(
  ({ items, placement }: ToolbarRendererProps) => {
    const placementItems = useMemo(
      () => items.filter((item) => item.placement === placement),
      [items, placement]
    );
    const sections = useMemo(
      () => splitToolbarSections(placementItems),
      [placementItems]
    );

    if (sections.length === 0) {
      return null;
    }

    return (
      <div className={styles.toolbar} data-owb-editor-toolbar={placement}>
        {sections.map((section) => {
          if (section.kind === 'separator') {
            return (
              <span
                aria-hidden
                className={styles.divider}
                key={section.item.id}
              />
            );
          }

          return (
            <div className={styles.section} key={section.items[0]?.id}>
              {section.items.map((item) => (
                <ToolbarItemNode
                  item={item}
                  key={item.id}
                  placement={placement}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  }
);
