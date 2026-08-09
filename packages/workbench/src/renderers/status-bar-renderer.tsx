import type {
  StatusBarItemDescriptor,
  StatusBarItemRendererRegistration,
  StatusBarTextItemDescriptor,
} from '@openenvx/core';
import { isStatusBarDropdownItem } from '@openenvx/core';
import { memo, useMemo } from 'react';
import type { ComponentType } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { ShellDropdownControl } from './shell-dropdown-control';

import styles from './status-bar.module.css';

interface Props {
  items: StatusBarItemDescriptor[];
  itemRenderers?: StatusBarItemRendererRegistration[];
}

const EMPTY_RENDERERS: StatusBarItemRendererRegistration[] = [];

export const StatusBarRenderer = memo(
  ({ items, itemRenderers = EMPTY_RENDERERS }: Props) => {
    const { executeCommand } = useWorkbenchContext();
    const rendererByKind = useMemo(() => {
      const map = new Map<string, unknown>();
      for (const renderer of itemRenderers) {
        map.set(renderer.kind, renderer.Component);
      }
      return map;
    }, [itemRenderers]);

    const leftItems = items.filter((item) => item.alignment === 'left');
    const rightItems = items.filter((item) => item.alignment === 'right');

    if (leftItems.length === 0 && rightItems.length === 0) {
      return null;
    }

    const renderItem = (item: StatusBarItemDescriptor) => {
      if (isStatusBarDropdownItem(item)) {
        return (
          <ShellDropdownControl
            id={item.id}
            items={item.items}
            key={item.id}
            label={item.label}
            labelBinding={item.labelBinding}
            labelSuffix={item.labelSuffix}
            variant="statusBar"
          />
        );
      }

      const kind = item.kind ?? 'text';
      const customRenderer = rendererByKind.get(kind);
      if (customRenderer) {
        const Component = customRenderer as ComponentType<{
          item: StatusBarItemDescriptor;
        }>;
        return <Component item={item} key={item.id} />;
      }

      return renderTextItem(
        item as StatusBarTextItemDescriptor,
        executeCommand
      );
    };

    return (
      <div className={styles.bar}>
        <div className={styles.left}>{leftItems.map(renderItem)}</div>
        <div className={styles.right}>{rightItems.map(renderItem)}</div>
      </div>
    );
  }
);

function renderTextItem(
  item: StatusBarTextItemDescriptor,
  executeCommand: (commandId: string) => Promise<boolean>
) {
  if (item.commandId) {
    return (
      <button
        className={styles.item}
        key={item.id}
        onClick={() => {
          void executeCommand(item.commandId!);
        }}
        type="button"
      >
        {item.text}
      </button>
    );
  }

  return (
    <span className={styles.selection} key={item.id}>
      {item.text}
    </span>
  );
}
