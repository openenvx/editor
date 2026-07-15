import type { MenuItemDescriptor } from '@openenvx/headless';
import { isCommandMenuItem } from '@openenvx/headless';
import { useCallback, useState } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useMountEffect } from '../hooks/use-mount-effect';

import dropdownStyles from '../primitives/dropdown-menu.module.css';
import styles from './context-menu.module.css';

interface Props {
  items: MenuItemDescriptor[];
  children: React.ReactNode;
}

function ContextMenuOverlay({
  menuItems,
  commandStates,
  position,
  onClose,
  onExecute,
}: {
  menuItems: MenuItemDescriptor[];
  commandStates: Record<string, { canExecute: boolean }>;
  position: { x: number; y: number };
  onClose: () => void;
  onExecute: (commandId: string) => void;
}) {
  useMountEffect(() => {
    const close = () => onClose();
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  });

  return (
    <div
      className={`${dropdownStyles.content} ${styles.menu}`}
      role="menu"
      style={{ left: position.x, top: position.y }}
    >
      {menuItems.map((item) => {
        if (!isCommandMenuItem(item)) {
          return null;
        }
        const canExecute = commandStates[item.commandId]?.canExecute ?? true;
        return (
          <button
            className={dropdownStyles.item}
            disabled={!canExecute}
            key={item.commandId}
            onClick={() => {
              onExecute(item.commandId);
              onClose();
            }}
            role="menuitem"
            type="button"
          >
            <span className={dropdownStyles.itemLabel}>
              {item.label ?? item.commandId}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ContextMenuRenderer({ items, children }: Props) {
  const { api, executeCommand } = useWorkbenchContext();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [menuItems, setMenuItems] = useState<MenuItemDescriptor[]>([]);
  const [commandStates, setCommandStates] = useState<
    Record<string, { canExecute: boolean }>
  >({});

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (items.length === 0) {
        return;
      }
      const fresh = api.getSnapshot();
      if (fresh.contextMenu.length === 0) {
        return;
      }
      event.preventDefault();
      setMenuItems(fresh.contextMenu);
      setCommandStates(fresh.commandStates);
      setPosition({ x: event.clientX, y: event.clientY });
      setOpen(true);
    },
    [api, items.length]
  );

  if (items.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      <div className={styles.target} onContextMenu={handleContextMenu}>
        {children}
      </div>
      {open ? (
        <ContextMenuOverlay
          commandStates={commandStates}
          menuItems={menuItems}
          onClose={() => setOpen(false)}
          onExecute={(commandId) => {
            void executeCommand(commandId);
          }}
          position={position}
        />
      ) : null}
    </>
  );
}
