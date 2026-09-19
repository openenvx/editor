import {
  ContextKeyServiceId,
  isTopBarDropdownItem,
  isTopBarGroupItem,
  type TopBarCommandItemDescriptor,
  type TopBarDropdownItemDescriptor,
  type TopBarGroupItemDescriptor,
  type TopBarItemDescriptor,
  type TopBarPlacement,
  type TopBarStatusItemDescriptor,
  type MenuItemDescriptor,
  type TopBarTitleItemDescriptor,
} from '@openenvx/studio/core';
import { IconCheck } from '@tabler/icons-react';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useContextKeysRevision } from '../hooks/use-context-key';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { DropdownMenuRenderer } from './dropdown-menu-renderer';
import { ShellDropdownControl } from './shell-dropdown-control';

import styles from './top-bar-renderer.module.css';

export interface TopBarRendererProps {
  items: TopBarItemDescriptor[];
}

const PLACEMENT_CLASS: Record<TopBarPlacement, string> = {
  center: styles.center,
  left: styles.left,
  right: styles.right,
};

type TopBarCommandVariant = 'icon' | 'label' | 'primary';

function resolveCommandCanExecute(
  commandStates: Record<string, { canExecute?: boolean }> | null | undefined,
  commandId: string,
  variant: TopBarCommandVariant = 'label'
): boolean {
  const canExecute = commandStates?.[commandId]?.canExecute;
  if (canExecute !== undefined) {
    return canExecute;
  }
  if (variant === 'primary') {
    return true;
  }
  if (variant === 'icon') {
    return false;
  }
  return true;
}

function resolveTitle(
  item: TopBarTitleItemDescriptor,
  editorTitle: string | null | undefined,
  t: (key: string) => string
): string {
  if (item.titleBinding === 'editorTitle') {
    return editorTitle?.trim() || 'Untitled';
  }
  if (item.titleKey) {
    return t(item.titleKey);
  }
  return item.title ?? 'Untitled';
}

function TopBarCommandButton({ item }: { item: TopBarCommandItemDescriptor }) {
  const { executeCommand, api } = useWorkbenchContext();
  const commandStates = useWorkbenchContextSelector(
    (state) => state.commandStates
  );
  useContextKeysRevision();
  const { t } = useWorkbenchTranslation();
  const contextKeys = api.getService(ContextKeyServiceId);

  const label = item.labelKey ? t(item.labelKey) : item.label;
  const variant = item.variant ?? (item.icon && !label ? 'icon' : 'label');
  const canExecute = resolveCommandCanExecute(
    commandStates,
    item.commandId,
    variant
  );
  if (item.hideWhenDisabled && !canExecute) {
    return null;
  }

  const ariaLabel = item.ariaLabelKey
    ? t(item.ariaLabelKey)
    : (item.ariaLabel ?? label);
  const active = item.toggledWhen
    ? (contextKeys?.evaluate(item.toggledWhen) ?? false)
    : false;

  if (variant === 'primary') {
    return (
      <button
        aria-label={ariaLabel}
        className={styles.primaryButton}
        disabled={!canExecute}
        type="button"
        onClick={() => void executeCommand(item.commandId, item.args)}
      >
        {label}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        aria-label={ariaLabel}
        aria-pressed={item.toggledWhen ? active : undefined}
        className={[styles.iconButton, active ? styles.iconButtonActive : '']
          .filter(Boolean)
          .join(' ')}
        disabled={!canExecute}
        type="button"
        onClick={() => void executeCommand(item.commandId, item.args)}
      >
        {item.icon ? <WorkbenchIcon id={item.icon} size={14} /> : label}
      </button>
    );
  }

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={item.toggledWhen ? active : undefined}
      className={[styles.labelButton, active ? styles.labelButtonActive : '']
        .filter(Boolean)
        .join(' ')}
      disabled={!canExecute}
      type="button"
      onClick={() => void executeCommand(item.commandId, item.args)}
    >
      {item.icon ? <WorkbenchIcon id={item.icon} size={14} /> : null}
      {label}
    </button>
  );
}

function TopBarGroupCommandButton({
  child,
  groupVariant,
}: {
  child: TopBarCommandItemDescriptor;
  groupVariant: TopBarGroupItemDescriptor['groupVariant'];
}) {
  const { executeCommand, api } = useWorkbenchContext();
  const commandStates = useWorkbenchContextSelector(
    (state) => state.commandStates
  );
  useContextKeysRevision();
  const { t } = useWorkbenchTranslation();
  const contextKeys = api.getService(ContextKeyServiceId);

  const label = child.labelKey ? t(child.labelKey) : child.label;
  const isSegmented = groupVariant === 'segmented';
  const canExecute = resolveCommandCanExecute(
    commandStates,
    child.commandId,
    isSegmented ? 'label' : 'icon'
  );
  if (child.hideWhenDisabled && !canExecute) {
    return null;
  }
  const ariaLabel = child.ariaLabelKey
    ? t(child.ariaLabelKey)
    : (child.ariaLabel ?? label);
  const active = child.toggledWhen
    ? (contextKeys?.evaluate(child.toggledWhen) ?? false)
    : false;

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={child.toggledWhen ? active : undefined}
      className={[
        isSegmented ? styles.segmentedButton : styles.iconButton,
        active
          ? isSegmented
            ? styles.segmentedButtonActive
            : styles.iconButtonActive
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={!canExecute}
      type="button"
      onClick={() => void executeCommand(child.commandId, child.args)}
    >
      {child.icon ? <WorkbenchIcon id={child.icon} size={14} /> : null}
      {isSegmented ? label : null}
    </button>
  );
}

function TopBarGroup({ item }: { item: TopBarGroupItemDescriptor }) {
  const groupClass =
    item.groupVariant === 'segmented'
      ? styles.segmentedGroup
      : styles.inlineGroup;

  return (
    <div className={groupClass}>
      {item.items.map((child) => (
        <TopBarGroupCommandButton
          child={child}
          groupVariant={item.groupVariant}
          key={child.id}
        />
      ))}
    </div>
  );
}

function TopBarMenuDropdown({ item }: { item: TopBarDropdownItemDescriptor }) {
  const { t } = useWorkbenchTranslation();
  const menuLabel = item.labelKey ? t(item.labelKey) : item.label;

  if (item.variant === 'menu') {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <button
            aria-label={menuLabel ?? 'More actions'}
            className={styles.iconButton}
            type="button"
          >
            {item.icon ? <WorkbenchIcon id={item.icon} size={14} /> : menuLabel}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRenderer items={item.items as MenuItemDescriptor[]} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <ShellDropdownControl
      icon={item.icon}
      id={item.id}
      items={item.items}
      label={item.label}
      labelBinding={item.labelBinding}
      labelKey={item.labelKey}
      labelSuffix={item.labelSuffix}
      variant="toolbar"
    />
  );
}

function TopBarTitle({
  item,
  editorTitle,
}: {
  item: TopBarTitleItemDescriptor;
  editorTitle?: string | null;
}) {
  const { t } = useWorkbenchTranslation();
  return (
    <button className={styles.titleButton} type="button">
      {resolveTitle(item, editorTitle, t)}
    </button>
  );
}

function TopBarStatus({ item }: { item: TopBarStatusItemDescriptor }) {
  const { t } = useWorkbenchTranslation();
  const label = item.labelKey ? t(item.labelKey) : item.label;
  return (
    <span className={styles.status}>
      {item.icon === 'check' ? (
        <IconCheck
          aria-hidden
          className={styles.statusIcon}
          size={12}
          stroke={2}
        />
      ) : item.icon ? (
        <WorkbenchIcon id={item.icon} size={12} />
      ) : null}
      {label}
    </span>
  );
}

function TopBarItem({
  item,
  editorTitle,
}: {
  item: TopBarItemDescriptor;
  editorTitle?: string | null;
}) {
  if (item.kind === 'separator') {
    return <span className={styles.divider} />;
  }
  if (item.kind === 'title') {
    return <TopBarTitle editorTitle={editorTitle} item={item} />;
  }
  if (item.kind === 'status') {
    return <TopBarStatus item={item} />;
  }
  if (isTopBarGroupItem(item)) {
    return <TopBarGroup item={item} />;
  }
  if (isTopBarDropdownItem(item)) {
    return <TopBarMenuDropdown item={item} />;
  }
  return <TopBarCommandButton item={item} />;
}

function TopBarRegion({
  placement,
  items,
  editorTitle,
}: {
  placement: TopBarPlacement;
  items: TopBarItemDescriptor[];
  editorTitle?: string | null;
}) {
  const regionItems = useMemo(
    () => items.filter((item) => item.placement === placement),
    [items, placement]
  );

  if (regionItems.length === 0) {
    return null;
  }

  return (
    <div className={PLACEMENT_CLASS[placement]}>
      {regionItems.map((item) => (
        <TopBarItem editorTitle={editorTitle} item={item} key={item.id} />
      ))}
    </div>
  );
}

export const TopBarRenderer = memo(({ items }: TopBarRendererProps) => {
  const editorTitle = useWorkbenchContextSelector(
    (state) => state.editor?.title
  );

  if (items.length === 0) {
    return null;
  }

  const hasCenter = items.some((item) => item.placement === 'center');

  return (
    <div className={styles.root}>
      <TopBarRegion editorTitle={editorTitle} items={items} placement="left" />
      {hasCenter ? (
        <TopBarRegion
          editorTitle={editorTitle}
          items={items}
          placement="center"
        />
      ) : null}
      <TopBarRegion editorTitle={editorTitle} items={items} placement="right" />
    </div>
  );
});
