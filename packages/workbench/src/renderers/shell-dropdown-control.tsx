import type { ShellDropdownMenuItemDescriptor } from '@openenvx/headless';
import { ChevronUp } from 'lucide-react';
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
  labelKey?: string;
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
    labelKey,
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
      if (labelKey) {
        return t(labelKey);
      }
      return label ?? '';
    }, [label, labelBinding, labelKey, labelSuffix, t, zoomPercent]);

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

    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className={triggerClass} type="button">
            <span>{displayLabel}</span>
            <ChevronUp aria-hidden className={styles.chevron} size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuGroups groups={groups} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
