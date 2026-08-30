import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type {
  PropertyHostContext,
  PropertyPathContextOptions,
  MenuItemDescriptor,
  ViewContainerDescriptor,
  WorkbenchApi,
} from '@openenvx/core';
import { mergePrimaryContainerOrder } from '@openenvx/core';
import { Fragment, forwardRef, useCallback, useMemo, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import {
  sortableDragStyle,
  useSortableContainerSensors,
  useSortableOrderDragEnd,
} from '../hooks/use-sortable-container-order';
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
import { ViewContainerHeader } from './view-container-header';

import styles from './activity-sidebar.module.css';

export interface ActivitySidebarProps {
  viewContainers: ViewContainerDescriptor[];
  contextMenuItems?: MenuItemDescriptor[];
  createPropertyHostContext?: (
    options: PropertyPathContextOptions,
    helpers: {
      api: WorkbenchApi;
      executeCommand: (commandId: string) => Promise<boolean>;
    }
  ) => PropertyHostContext;
}

type ActivityItemButtonProps = {
  container: ViewContainerDescriptor;
  isActive?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  dragHandleProps?: Record<string, unknown>;
  style?: CSSProperties;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children' | 'style'
>;

const ActivityItemButton = forwardRef<
  HTMLButtonElement,
  ActivityItemButtonProps
>(
  (
    {
      container,
      isActive,
      onClick,
      className,
      dragHandleProps,
      style,
      ...props
    },
    ref
  ) => (
    <button
      {...props}
      {...dragHandleProps}
      aria-label={container.title}
      aria-pressed={isActive}
      className={cn(
        styles.activityItem,
        isActive && styles.activityItemActive,
        className
      )}
      onClick={onClick}
      ref={ref}
      style={style}
      title={container.title}
      type="button"
    >
      <span className={styles.activityIconWrap}>
        <WorkbenchIcon id={container.icon} size={16} />
      </span>
      <span className={styles.activityLabel}>{container.title}</span>
    </button>
  )
);

function SortablePanelItem({
  id,
  children,
}: {
  id: string;
  children: (props: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    dragHandleProps: Record<string, unknown>;
  }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = sortableDragStyle(transform, transition, isDragging);
  return (
    <>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        setNodeRef,
        style,
      })}
    </>
  );
}

export function ActivitySidebar({
  viewContainers,
  contextMenuItems,
  createPropertyHostContext,
}: ActivitySidebarProps) {
  const { api } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const activeContainerByLocation = useWorkbenchContextSelector(
    (state) => state.activeContainerByLocation
  );
  const layout = useWorkbenchContextSelector((state) => state.layout);
  const showActivityBar = layout?.activityBar !== false;

  const primaryContainers = useMemo(
    () => viewContainers.filter((c) => (c.location ?? 'primary') === 'primary'),
    [viewContainers]
  );
  const panelContainers = useMemo(
    () => primaryContainers.filter((c) => c.sidebarBehavior === 'panel'),
    [primaryContainers]
  );
  const showPrimarySidebar =
    layout?.primarySidebar !== false &&
    (showActivityBar || panelContainers.length <= 1);
  /** Only panels are sortable - dropdown/command can't share a drag surface with their click target. */
  const sortableIds = useMemo(
    () => panelContainers.map((container) => container.id),
    [panelContainers]
  );
  const activeFromService = activeContainerByLocation?.primary;
  const activeContainerId =
    activeFromService &&
    panelContainers.some((container) => container.id === activeFromService)
      ? activeFromService
      : (panelContainers[0]?.id ?? '');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const sensors = useSortableContainerSensors();

  const applyPrimaryOrder = useCallback(
    (panelOrder: string[]) => {
      api.setContainerOrder(
        'primary',
        mergePrimaryContainerOrder(primaryContainers, panelOrder)
      );
    },
    [api, primaryContainers]
  );

  const handleDragEnd = useSortableOrderDragEnd(sortableIds, applyPrimaryOrder);

  const activityBarLabel =
    sortableIds.length > 1
      ? `${t('activityBar')}. ${t('view.reorderHint')}`
      : t('activityBar');

  const closeDropdown = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const setActivePrimary = useCallback(
    (containerId: string) => {
      if (!showPrimarySidebar) {
        api.setPrimarySidebarVisible(true);
      }
      api.setActiveContainer('primary', containerId);
    },
    [api, showPrimarySidebar]
  );

  const activePanel = panelContainers.find((c) => c.id === activeContainerId);
  const primaryHeader = useWorkbenchContextSelector((state) =>
    activeContainerId
      ? (state.sidebarHeaders?.[activeContainerId] ?? undefined)
      : undefined
  );

  if (!(showActivityBar || showPrimarySidebar)) {
    return null;
  }

  let previousGroup: number | undefined;

  const activityItems = primaryContainers.map((container) => {
    const showSeparator =
      previousGroup !== undefined && container.sidebarGroup !== previousGroup;
    previousGroup = container.sidebarGroup;

    const isPanelActive =
      container.sidebarBehavior === 'panel' &&
      container.id === activeContainerId &&
      showPrimarySidebar;

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
        <SortablePanelItem id={container.id}>
          {({ setNodeRef, style, dragHandleProps }) => (
            <ActivityItemButton
              container={container}
              dragHandleProps={dragHandleProps}
              isActive={isPanelActive}
              onClick={() => {
                closeDropdown();
                setActivePrimary(container.id);
              }}
              ref={setNodeRef}
              style={style}
            />
          )}
        </SortablePanelItem>
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
  });

  return (
    <div className={styles.root}>
      {showActivityBar ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <nav aria-label={activityBarLabel} className={styles.activityBar}>
              {activityItems}
            </nav>
          </SortableContext>
        </DndContext>
      ) : null}
      {showPrimarySidebar && activePanel ? (
        <div className={styles.sidePanel}>
          <ViewContainerHeader
            containerId={activePanel.id}
            header={primaryHeader ?? undefined}
            location="primary"
            title={activePanel.title}
          />
          <div className={styles.sidePanelContent}>
            <ContextMenuRenderer items={contextMenuItems ?? []}>
              <ViewContainerViews
                container={activePanel}
                createHostContext={createPropertyHostContext}
              />
            </ContextMenuRenderer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
