import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import type { TemplateVariable } from '@openenvx/core/schema';
import { formatVariableToken } from '@openenvx/core/schema';
import { GripVertical, Pencil } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import {
  sortableDragStyle,
  useSortableContainerSensors,
} from '../hooks/use-sortable-container-order';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import { IconButton } from '../primitives/icon-button';
import {
  PropertyList,
  PropertyListAdd,
  PropertyListRow,
} from '../primitives/property-list';
import {
  VariableEditDialog,
  type VariableEditMode,
} from './variable-edit-dialog';

import styles from './variables-panel.module.css';

function SortableVariableRow({
  variable,
  onEdit,
}: {
  variable: TemplateVariable;
  onEdit: (variable: TemplateVariable) => void;
}) {
  const { t } = useWorkbenchTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id });
  const style = sortableDragStyle(transform, transition, isDragging);

  return (
    <PropertyListRow
      actions={
        <IconButton
          aria-label={t('variables.edit')}
          onClick={() => onEdit(variable)}
          size="sm"
        >
          <Pencil size={14} />
        </IconButton>
      }
      className={cn(styles.row, isDragging && styles.rowDragging)}
      dragging={isDragging}
      label={
        <span className={styles.token}>
          {formatVariableToken(variable.key)}
        </span>
      }
      leading={
        <button
          aria-label={t('variables.reorder')}
          className={styles.dragHandle}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      }
      rowRef={setNodeRef}
      rowStyle={style}
    />
  );
}

export const VariablesPanel = memo(() => {
  const { executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const variableList = scene?.variables;
  const { t } = useWorkbenchTranslation();
  const [editMode, setEditMode] = useState<VariableEditMode | null>(null);
  const sortableIds = useMemo(
    () => (variableList ?? []).map((entry) => entry.id),
    [variableList]
  );
  const sensors = useSortableContainerSensors();

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      void executeCommand('scene.reorderVariables', {
        activeId: String(active.id),
        overId: String(over.id),
      });
    },
    [executeCommand]
  );

  const handleCreate = useCallback(() => {
    setEditMode({ mode: 'create' });
  }, []);

  const handleEdit = useCallback((variable: TemplateVariable) => {
    setEditMode({ mode: 'edit', variable });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setEditMode(null);
  }, []);

  const handleSave = useCallback(
    (patch: { key: string; label?: string; sample?: string }) => {
      if (editMode?.mode === 'create') {
        void executeCommand('scene.addVariable', patch);
      } else if (editMode?.mode === 'edit') {
        void executeCommand('scene.updateVariable', {
          id: editMode.variable.id,
          ...patch,
        });
      }
      setEditMode(null);
    },
    [editMode, executeCommand]
  );

  const handleDelete = useCallback(() => {
    if (editMode?.mode !== 'edit') {
      return;
    }
    void executeCommand('scene.removeVariable', { id: editMode.variable.id });
    setEditMode(null);
  }, [editMode, executeCommand]);

  const isEmpty = !variableList?.length;

  return (
    <>
      <div className={styles.panel}>
        {isEmpty ? (
          <p className={styles.empty}>{t('variables.empty')}</p>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <PropertyList className={styles.list}>
                {(variableList ?? []).map((variable) => (
                  <SortableVariableRow
                    key={variable.id}
                    onEdit={handleEdit}
                    variable={variable}
                  />
                ))}
              </PropertyList>
            </SortableContext>
          </DndContext>
        )}
        <PropertyListAdd className={styles.add} onClick={handleCreate}>
          {t('variables.create')}
        </PropertyListAdd>
      </div>
      <VariableEditDialog
        editMode={editMode}
        existingVariables={variableList ?? []}
        onClose={handleCloseDialog}
        onDelete={editMode?.mode === 'edit' ? handleDelete : undefined}
        onSave={handleSave}
        open={editMode !== null}
      />
    </>
  );
});
