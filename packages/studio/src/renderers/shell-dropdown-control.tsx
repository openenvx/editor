import type { ShellDropdownMenuItemDescriptor } from '@openenvx/headless';
import { memo, useMemo } from 'react';

import { useEditorViewport } from '../context/editor-viewport-context';
import { useWorkbenchContext } from '../context/workbench-context';
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
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
  variant: 'toolbar' | 'statusBar';
}

function resolveLabelBinding(
  labelBinding: string,
  zoomPercent: number
): string | null {
  if (labelBinding === 'editorZoomPercent') {
    return String(zoomPercent);
  }
  return null;
}

export const ShellDropdownControl = memo(
  ({
    id,
    label,
    labelBinding,
    labelSuffix = '',
    items,
    variant,
  }: ShellDropdownControlProps) => {
    const { executeCommand } = useWorkbenchContext();
    const { t } = useWorkbenchTranslation();
    const { zoomPercent } = useEditorViewport();

    const displayLabel = useMemo(() => {
      if (labelBinding) {
        const bound = resolveLabelBinding(labelBinding, zoomPercent);
        if (bound !== null) {
          return `${bound}${labelSuffix}`;
        }
      }
      return label ?? '';
    }, [label, labelBinding, labelSuffix, zoomPercent]);

    const groups = useMemo(
      () => [
        items.map((item) => ({
          disabled: false,
          id: `${id}-${item.commandId}`,
          label: item.labelKey
            ? t(item.labelKey)
            : (item.label ?? item.commandId),
          onSelect: () => {
            void executeCommand(item.commandId);
          },
          shortcut: item.shortcut,
        })),
      ],
      [executeCommand, id, items, t]
    );

    const triggerClass =
      variant === 'toolbar' ? styles.trigger : styles.statusTrigger;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className={triggerClass} type="button">
            <span>{displayLabel}</span>
            <span aria-hidden className={styles.chevron}>
              ▴
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuGroups groups={groups} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
