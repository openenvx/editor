import type {
  MenuItemDescriptor,
  ViewContainerDescriptor,
} from '@openenvx/headless';
import { Fragment, forwardRef, useCallback, useMemo, useState } from 'react';
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { ContextMenuRenderer } from '../renderers/context-menu-renderer';
import { DropdownMenuRenderer } from '../renderers/dropdown-menu-renderer';
import { ViewPanelRenderer } from '../renderers/view-panel-renderer';

import styles from './activity-sidebar.module.css';

export type SidebarPanelComponent = ComponentType;

export interface ActivitySidebarProps {
  viewContainers: ViewContainerDescriptor[];
  contextMenuItems?: MenuItemDescriptor[];
  customPanels?: Record<string, SidebarPanelComponent>;
}

type ActivityItemButtonProps = {
  container: ViewContainerDescriptor;
  isActive?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;

const ActivityItemButton = forwardRef<
  HTMLButtonElement,
  ActivityItemButtonProps
>(
  (
    { container, isActive, onClick, className, type = 'button', ...props },
    ref
  ) => (
    <button
      {...props}
      aria-label={container.title}
      aria-pressed={isActive}
      className={cn(
        styles.activityItem,
        isActive && styles.activityItemActive,
        className
      )}
      onClick={onClick}
      ref={ref}
      title={container.title}
      type={type}
    >
      <span className={styles.activityIconWrap}>
        <WorkbenchIcon id={container.icon} size={16} />
      </span>
      <span className={styles.activityLabel}>{container.title}</span>
    </button>
  )
);

export function ActivitySidebar({
  viewContainers,
  contextMenuItems,
  customPanels,
}: ActivitySidebarProps) {
  const { executeCommand } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const panelContainers = useMemo(
    () => viewContainers.filter((c) => c.sidebarBehavior === 'panel'),
    [viewContainers]
  );
  const [activeContainerId, setActiveContainerId] = useState(
    () => panelContainers[0]?.id ?? ''
  );
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const closeDropdown = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const activePanel = panelContainers.find((c) => c.id === activeContainerId);
  const ActiveCustomPanel = activePanel
    ? customPanels?.[activePanel.id]
    : undefined;

  let previousGroup: number | undefined;

  return (
    <div className={styles.root}>
      <nav aria-label={t('activityBar')} className={styles.activityBar}>
        {viewContainers.map((container) => {
          const showSeparator =
            previousGroup !== undefined &&
            container.sidebarGroup !== previousGroup;
          previousGroup = container.sidebarGroup;

          const isPanelActive =
            container.sidebarBehavior === 'panel' &&
            container.id === activeContainerId;

          let activityItem: ReactNode;

          if (container.sidebarBehavior === 'dropdown') {
            const menuItems = container.menuItems;
            if (!menuItems || menuItems.length === 0) {
              return null;
            }

            activityItem = (
              <DropdownMenu
                onOpenChange={(open) => {
                  setOpenDropdownId(open ? container.id : null);
                }}
                open={openDropdownId === container.id}
              >
                <DropdownMenuTrigger className={styles.activityDropdown}>
                  <ActivityItemButton container={container} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right">
                  <DropdownMenuRenderer items={menuItems} />
                </DropdownMenuContent>
              </DropdownMenu>
            );
          } else if (container.sidebarBehavior === 'command') {
            activityItem = (
              <ActivityItemButton
                container={container}
                onClick={() => {
                  closeDropdown();
                  if (container.commandId) {
                    void executeCommand(container.commandId);
                  }
                }}
              />
            );
          } else {
            activityItem = (
              <ActivityItemButton
                container={container}
                isActive={isPanelActive}
                onClick={() => {
                  closeDropdown();
                  setActiveContainerId(container.id);
                }}
              />
            );
          }

          return (
            <Fragment key={container.id}>
              {showSeparator ? (
                <div aria-hidden className={styles.activitySeparator} />
              ) : null}
              {activityItem}
            </Fragment>
          );
        })}
      </nav>
      {activePanel ? (
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelContent}>
            {ActiveCustomPanel ? (
              <ActiveCustomPanel />
            ) : (
              <ContextMenuRenderer items={contextMenuItems ?? []}>
                <ViewPanelRenderer viewContainers={[activePanel]} />
              </ContextMenuRenderer>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
