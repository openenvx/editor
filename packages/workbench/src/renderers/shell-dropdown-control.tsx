import type {
  ShellDropdownMenuItemDescriptor,
  ToolbarPlacement,
} from '@openenvx/core';
import { isToolbarTopPlacement } from '@openenvx/core';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useContextKeyValue } from '../hooks/use-context-key';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroups,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { IconButton } from '../primitives/icon-button';

import styles from './shell-dropdown.module.css';

export interface ShellDropdownControlProps {
  id: string;
  icon?: string;
  label?: string;
  labelKey?: string;
  /** Context key whose string/number value is shown as the trigger label. */
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
  variant: 'toolbar' | 'statusBar';
  /** Toolbar placement drives menu side; ignored for statusBar. */
  placement?: ToolbarPlacement;
}

function formatBoundLabel(
  value: boolean | string | number | undefined,
  suffix: string
): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return `${value}${suffix}`;
  }
  return null;
}

const HOVER_CLOSE_DELAY_MS = 120;

export const ShellDropdownControl = memo(
  ({
    id,
    icon,
    label,
    labelKey,
    labelBinding,
    labelSuffix = '',
    items,
    variant,
    placement,
  }: ShellDropdownControlProps) => {
    const { executeCommand } = useWorkbenchContext();
    const commandStates = useWorkbenchContextSelector(
      (state) => state.commandStates
    );
    const { t } = useWorkbenchTranslation();
    const boundValue = useContextKeyValue(labelBinding ?? '');

    const openOnHover = Boolean(icon);
    const [hoverOpen, setHoverOpen] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimer = useCallback(() => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }, []);

    const openFromHover = useCallback(() => {
      clearCloseTimer();
      setHoverOpen(true);
    }, [clearCloseTimer]);

    const scheduleCloseFromHover = useCallback(() => {
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        setHoverOpen(false);
        closeTimerRef.current = null;
      }, HOVER_CLOSE_DELAY_MS);
    }, [clearCloseTimer]);

    useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

    const handleHoverOpenChange = useCallback(
      (next: boolean) => {
        if (!openOnHover) {
          return;
        }
        clearCloseTimer();
        setHoverOpen(next);
      },
      [clearCloseTimer, openOnHover]
    );

    const hoverPointerProps = openOnHover
      ? {
          onPointerEnter: openFromHover,
          onPointerLeave: scheduleCloseFromHover,
        }
      : undefined;

    const displayLabel = useMemo(() => {
      if (labelBinding) {
        const bound = formatBoundLabel(boundValue, labelSuffix);
        if (bound !== null) {
          return bound;
        }
      }
      if (labelKey) {
        return t(labelKey);
      }
      return label ?? '';
    }, [boundValue, label, labelBinding, labelKey, labelSuffix, t]);

    const groups = useMemo(
      () => [
        items.map((item) => ({
          disabled: !(commandStates?.[item.commandId]?.canExecute ?? true),
          id: `${id}-${item.commandId}`,
          label: item.labelKey
            ? t(item.labelKey)
            : (item.label ?? item.commandId),
          onSelect: () => {
            void executeCommand(item.commandId, item.args);
          },
          shortcut: item.shortcut,
        })),
      ],
      [commandStates, executeCommand, id, items, t]
    );

    const triggerClass =
      variant === 'toolbar' ? styles.trigger : styles.statusTrigger;
    const openUp =
      variant === 'statusBar' ||
      (placement !== undefined && !isToolbarTopPlacement(placement));
    const Chevron = openUp ? ChevronUp : ChevronDown;

    return (
      <DropdownMenu
        modal={!openOnHover}
        onOpenChange={openOnHover ? handleHoverOpenChange : undefined}
        open={openOnHover ? hoverOpen : undefined}
      >
        <DropdownMenuTrigger>
          {icon ? (
            <IconButton
              aria-label={displayLabel}
              title={displayLabel}
              type="button"
              {...hoverPointerProps}
            >
              <WorkbenchIcon id={icon} size={14} />
            </IconButton>
          ) : (
            <button className={triggerClass} type="button">
              <span>{displayLabel}</span>
              <Chevron aria-hidden className={styles.chevron} size={12} />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side={openUp ? 'top' : 'bottom'}>
          <div {...hoverPointerProps}>
            <DropdownMenuGroups groups={groups} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
