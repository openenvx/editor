import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  secondaryPanelContainers,
  shouldMountSecondarySidebar,
} from '@openenvx/headless';
import { memo, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import {
  sortableDragStyle,
  useSortableContainerSensors,
  useSortableOrderDragEnd,
} from '../hooks/use-sortable-container-order';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import {
  ViewContainerHeader,
  ViewContainerMoveMenu,
} from '../layout/view-container-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import {
  type CreatePropertyHostContext,
  ViewContainerViews,
} from './view-container-views';

import styles from './secondary-sidebar.module.css';

export interface SecondarySidebarRendererProps {
  createPropertyHostContext?: CreatePropertyHostContext;
}

function SortableTabTrigger({ id, title }: { id: string; title: string }) {
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
    <TabsTrigger
      ref={setNodeRef}
      style={style}
      value={id}
      {...attributes}
      {...listeners}
    >
      {title}
    </TabsTrigger>
  );
}

export const SecondarySidebarRenderer = memo(
  ({
    createPropertyHostContext: createHostContextProp,
  }: SecondarySidebarRendererProps) => {
    const { api } = useWorkbenchContext();
    const viewContainers = useWorkbenchContextSelector(
      (state) => state.viewContainers
    );
    const activeContainerByLocation = useWorkbenchContextSelector(
      (state) => state.activeContainerByLocation
    );
    const layout = useWorkbenchContextSelector((state) => state.layout);
    const sidebarHeaders = useWorkbenchContextSelector(
      (state) => state.sidebarHeaders
    );

    const secondaryContainers = useMemo(
      () => secondaryPanelContainers(viewContainers),
      [viewContainers]
    );
    const sortableIds = useMemo(
      () => secondaryContainers.map((container) => container.id),
      [secondaryContainers]
    );

    const sensors = useSortableContainerSensors();
    const handleDragEnd = useSortableOrderDragEnd(sortableIds, (orderedIds) => {
      api.setContainerOrder('secondary', orderedIds);
    });

    if (!shouldMountSecondarySidebar(layout, viewContainers)) {
      return null;
    }

    const activeId =
      activeContainerByLocation?.secondary &&
      secondaryContainers.some(
        (c) => c.id === activeContainerByLocation.secondary
      )
        ? activeContainerByLocation.secondary
        : secondaryContainers[0]!.id;

    if (secondaryContainers.length === 1) {
      const container = secondaryContainers[0]!;
      return (
        <div className={styles.root}>
          <ViewContainerHeader
            containerId={container.id}
            header={sidebarHeaders?.[container.id] ?? undefined}
            location="secondary"
            title={container.title}
          />
          <div className={styles.body}>
            <ViewContainerViews
              container={container}
              createHostContext={createHostContextProp}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.root}>
        <Tabs
          className={styles.tabs}
          onValueChange={(value) => {
            api.setActiveContainer('secondary', value);
          }}
          value={activeId}
        >
          <div className={styles.tabsHeader}>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={sortableIds}
                strategy={horizontalListSortingStrategy}
              >
                <TabsList>
                  {secondaryContainers.map((container) => (
                    <SortableTabTrigger
                      id={container.id}
                      key={container.id}
                      title={container.title}
                    />
                  ))}
                </TabsList>
              </SortableContext>
            </DndContext>
            <ViewContainerMoveMenu
              containerId={activeId}
              location="secondary"
            />
          </div>
          {secondaryContainers.map((container) => (
            <TabsContent forceMount key={container.id} value={container.id}>
              <ViewContainerViews
                container={container}
                createHostContext={createHostContextProp}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }
);
