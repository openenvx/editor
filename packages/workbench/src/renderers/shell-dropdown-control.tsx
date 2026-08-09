import type {
  ShellDropdownMenuItemDescriptor,
  ToolbarPlacement,
} from '@openenvx/core';
import { isToolbarTopPlacement } from '@openenvx/core';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useContextKeyValue } from '../hooks/use-context-key';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroups,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';

import styles from './shell-dropdown.module.css';

export interface ShellDropdownControlProps {
  id: string;
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

export const ShellDropdownControl = memo(
  ({
    id,
    label,
    labelKey,
    labelBinding,
    labelSuffix = '',
    items,
    variant,
    placement,
  }: ShellDropdownControlProps) => {
    const { executeCommand } = useWorkbenchContext();
    const { t } = useWorkbenchTranslation();
    const boundValue = useContextKeyValue(labelBinding ?? '');

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
          disabled: false,
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
      [executeCommand, id, items, t]
    );

    const triggerClass =
      variant === 'toolbar' ? styles.trigger : styles.statusTrigger;
    const openUp =
      variant === 'statusBar' ||
      (placement !== undefined && !isToolbarTopPlacement(placement));
    const Chevron = openUp ? ChevronUp : ChevronDown;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className={triggerClass} type="button">
            <span>{displayLabel}</span>
            <Chevron aria-hidden className={styles.chevron} size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side={openUp ? 'top' : 'bottom'}>
          <DropdownMenuGroups groups={groups} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
