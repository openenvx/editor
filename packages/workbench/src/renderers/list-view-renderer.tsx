import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ViewDescriptor, ViewTreeItem } from '@openenvx/core';
import { GripVertical } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import {
  sortableDragStyle,
  useSortableContainerSensors,
} from '../hooks/use-sortable-container-order';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { cn } from '../lib/cn';
import {
  PropertyList,
  PropertyListAdd,
  PropertyListRow,
} from '../primitives/property-list';

import styles from './list-view-renderer.module.css';

function ListRowLabel({ item }: { item: ViewTreeItem }) {
  const labelClass = item.label.startsWith('{{{')
    ? cn(styles.label, styles.labelMono)
    : styles.label;

  return (
    <div>
      <span className={labelClass}>{item.label}</span>
      {item.description ? (
        <p className={styles.description}>{item.description}</p>
      ) : null}
    </div>
  );
}

function ListRow({
  item,
  onCommand,
  reorderable,
}: {
  item: ViewTreeItem;
  onCommand: (commandId: string, args?: Record<string, unknown>) => void;
  reorderable: boolean;
}) {
  const { t } = useWorkbenchTranslation();
  const rowClick = item.commandId
    ? () => onCommand(item.commandId!, { id: item.id })
    : undefined;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ disabled: !reorderable, id: item.id });
  const style = reorderable
    ? sortableDragStyle(transform, transition, isDragging)
    : undefined;

  return (
    <PropertyListRow
      actions={item.actions?.map((action) => (
        <button
          aria-label={action.label}
          className={styles.rowAction}
          key={`${action.commandId}-${action.icon}`}
          onClick={() => onCommand(action.commandId, { id: item.id })}
          type="button"
        >
          <WorkbenchIcon id={action.icon} size={14} />
        </button>
      ))}
      className={cn(styles.row, isDragging && styles.rowDragging)}
      dragging={isDragging}
      label={<ListRowLabel item={item} />}
      leading={
        reorderable ? (
          <button
            aria-label={t('workbench.list.reorder')}
            className={styles.dragHandle}
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
        ) : undefined
      }
      onRowClick={rowClick}
      rowRef={reorderable ? setNodeRef : undefined}
      rowStyle={style}
    />
  );
}

export const ListViewRenderer = memo(({ view }: { view: ViewDescriptor }) => {
  if (view.content.kind !== 'list') {
    return null;
  }

  return <ListViewBody items={view.content.items} view={view} />;
});

function ListViewBody({
  view,
  items,
}: {
  view: ViewDescriptor;
  items: ViewTreeItem[];
}) {
  const { api, executeCommand } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const sortableIds = useMemo(() => items.map((entry) => entry.id), [items]);
  const sensors = useSortableContainerSensors();
  const reorderable = view.supportsReorder;

  const handleCommand = useCallback(
    (commandId: string, args?: Record<string, unknown>) => {
      void executeCommand(commandId, args);
    },
    [executeCommand]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const sourceItem = items.find((entry) => entry.id === String(active.id));
      const targetItem = items.find((entry) => entry.id === String(over.id));
      if (!(sourceItem && targetItem)) {
        return;
      }
      api.moveViewItem(view.id, sourceItem.source, targetItem.source, 'before');
    },
    [api, items, view.id]
  );

  const handleAdd = useCallback(() => {
    if (view.addCommandId) {
      void executeCommand(view.addCommandId);
    }
  }, [executeCommand, view.addCommandId]);

  const isEmpty = items.length === 0;
  const addLabel = view.addLabel ?? t('workbench.list.add');
  const list = (
    <PropertyList className={styles.list}>
      {items.map((item) => (
        <ListRow
          item={item}
          key={item.id}
          onCommand={handleCommand}
          reorderable={reorderable}
        />
      ))}
    </PropertyList>
  );

  return (
    <div className={styles.panel}>
      {isEmpty && view.emptyMessage ? (
        <p className={styles.empty}>{view.emptyMessage}</p>
      ) : reorderable ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {list}
          </SortableContext>
        </DndContext>
      ) : (
        list
      )}
      {view.addCommandId ? (
        <PropertyListAdd className={styles.add} onClick={handleAdd}>
          {addLabel}
        </PropertyListAdd>
      ) : null}
    </div>
  );
}

ListViewRenderer.displayName = 'ListViewRenderer';
