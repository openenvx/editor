import type {
  InspectorHostContext,
  InspectorPathContextOptions,
  MenuItemDescriptor,
  ViewContainerDescriptor,
  WorkbenchApi,
} from '@openenvx/headless';
import { Fragment, forwardRef, useCallback, useMemo, useState } from 'react';
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
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
import { ViewContainerViews } from '../renderers/view-container-views';

import styles from './activity-sidebar.module.css';

export type SidebarPanelComponent = ComponentType;

export interface ActivitySidebarProps {
  viewContainers: ViewContainerDescriptor[];
  contextMenuItems?: MenuItemDescriptor[];
  customPanels?: Record<string, SidebarPanelComponent>;
  createInspectorHostContext?: (
    options: InspectorPathContextOptions,
    helpers: {
      api: WorkbenchApi;
      executeCommand: (commandId: string) => Promise<boolean>;
    }
  ) => InspectorHostContext;
  viewPanels?: Record<string, ComponentType>;
}

type ActivityItemButtonProps = {
  container: ViewContainerDescriptor;
  isActive?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;

const ActivityItemButton = forwardRef<
  HTMLButtonElement,
  ActivityItemButtonProps
>(({ container, isActive, onClick, className, ...props }, ref) => (
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
    type="button"
  >
    <span className={styles.activityIconWrap}>
      <WorkbenchIcon id={container.icon} size={16} />
    </span>
    <span className={styles.activityLabel}>{container.title}</span>
  </button>
));

export function ActivitySidebar({
  viewContainers,
  contextMenuItems,
  customPanels,
  createInspectorHostContext,
  viewPanels,
}: ActivitySidebarProps) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const activeContainerByLocation = useWorkbenchContextSelector(
    (state) => state.activeContainerByLocation
  );
  const primaryContainers = useMemo(
    () => viewContainers.filter((c) => (c.location ?? 'primary') === 'primary'),
    [viewContainers]
  );
  const panelContainers = useMemo(
    () => primaryContainers.filter((c) => c.sidebarBehavior === 'panel'),
    [primaryContainers]
  );
  const activeFromService = activeContainerByLocation?.primary;
  const activeContainerId =
    activeFromService &&
    panelContainers.some((container) => container.id === activeFromService)
      ? activeFromService
      : (panelContainers[0]?.id ?? '');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const closeDropdown = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const setActivePrimary = useCallback(
    (containerId: string) => {
      api.setActiveContainer('primary', containerId);
    },
    [api]
  );

  const activePanel = panelContainers.find((c) => c.id === activeContainerId);
  const ActiveCustomPanel = activePanel
    ? customPanels?.[activePanel.id]
    : undefined;

  let previousGroup: number | undefined;

  return (
    <div className={styles.root}>
      <nav aria-label={t('activityBar')} className={styles.activityBar}>
        {primaryContainers.map((container) => {
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
                    void api.executeCommand(container.commandId);
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
                  setActivePrimary(container.id);
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
                <ViewContainerViews
                  container={activePanel}
                  createHostContext={createInspectorHostContext}
                  viewPanels={viewPanels}
                />
              </ContextMenuRenderer>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
