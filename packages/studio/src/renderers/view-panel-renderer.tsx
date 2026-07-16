import type { Scene } from '@openenvx/core';
import type {
  ViewContainerDescriptor,
  ViewDescriptor,
  ViewTreeItem,
} from '@openenvx/headless';
import { Lock, LockOpen } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import {
  resolveViewHoveredIds,
  useViewTreeHoverSync,
} from '../hooks/use-view-tree-hover-sync';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { WorkbenchIcon } from '../icons/workbench-icon';
import { PanelSection } from '../primitives/panel-section';
import { Tooltip } from '../primitives/tooltip';
import { TreeDndList } from './tree-dnd-list';
import { treePaddingLeft } from './tree-dnd-utils';

import styles from './view-panel.module.css';

interface Props {
  viewContainers: ViewContainerDescriptor[];
}

function TreeItemIcon({ icon }: { icon?: string }) {
  if (!icon) {
    return <span className={styles.treeToggleSpacer} />;
  }
  return <WorkbenchIcon className={styles.treeItemIcon} id={icon} size={14} />;
}

function LockButton({
  item,
  onSelect,
  onToggle,
}: {
  item: ViewTreeItem;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { t } = useWorkbenchTranslation();
  if (!item.lockedCommandId) {
    return null;
  }
  const Icon = item.locked ? Lock : LockOpen;
  const tooltip =
    item.tooltip ?? (item.locked ? t('layer.unlock') : t('layer.lock'));
  return (
    <Tooltip content={tooltip} side="top" align="center">
      <button
        aria-label={tooltip}
        className={
          item.locked
            ? `${styles.treeLockButton} ${styles.treeLockButtonVisible}`
            : styles.treeLockButton
        }
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
          onToggle();
        }}
        type="button"
      >
        <Icon aria-hidden className={styles.treeItemTrailing} size={12} />
      </button>
    </Tooltip>
  );
}

function isItemVisible(
  items: ViewTreeItem[],
  index: number,
  collapsed: Set<string>
): boolean {
  const item = items[index]!;
  if (item.depth === 0) {
    return true;
  }
  for (let i = index - 1; i >= 0; i -= 1) {
    const ancestor = items[i]!;
    if (ancestor.depth < item.depth) {
      if (ancestor.hasChildren && collapsed.has(ancestor.id)) {
        return false;
      }
      if (ancestor.depth === item.depth - 1) {
        return true;
      }
    }
  }
  return true;
}

function StaticTreeRow({
  item,
  isSelected,
  isHovered,
  isCollapsed,
  onSelect,
  onToggleCollapsed,
  onToggleLock,
  onHover,
}: {
  item: ViewTreeItem;
  isSelected: boolean;
  isHovered: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
  onToggleCollapsed: () => void;
  onToggleLock?: () => void;
  onHover?: () => void;
}) {
  const className = [
    styles.treeItem,
    isSelected ? styles.treeItemSelected : '',
    isHovered ? styles.treeItemHovered : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={
        item.locked ? `${className} ${styles.treeItemLocked}` : className
      }
      onContextMenu={() => {
        onSelect();
      }}
      onMouseEnter={onHover}
      style={{ paddingLeft: `${treePaddingLeft(item.depth)}px` }}
    >
      {item.hasChildren ? (
        <button
          aria-expanded={!isCollapsed}
          className={styles.treeToggle}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapsed();
          }}
          type="button"
        >
          {isCollapsed ? '▸' : '▾'}
        </button>
      ) : (
        <span className={styles.treeToggleSpacer} />
      )}
      <TreeItemIcon icon={item.icon} />
      <button
        className={styles.treeItemLabel}
        onClick={onSelect}
        type="button"
        title={item.tooltip ?? undefined}
      >
        {item.label}
      </button>
      <LockButton
        item={item}
        onSelect={onSelect}
        onToggle={() => onToggleLock?.()}
      />
    </div>
  );
}

function ViewPanelBody({
  view,
  collapsed,
  setCollapsed,
  hoveredLayerId,
  activePageId,
  layerSelectedIds,
  scene,
}: {
  view: ViewDescriptor;
  collapsed: Set<string>;
  setCollapsed: React.Dispatch<React.SetStateAction<Set<string>>>;
  hoveredLayerId: string | null;
  activePageId: string;
  layerSelectedIds: Set<string>;
  scene: Scene;
}) {
  const { api } = useWorkbenchContext();

  useViewTreeHoverSync(view, hoveredLayerId, scene, setCollapsed);

  const selectedIds =
    view.viewSelection === 'page'
      ? new Set(activePageId ? [activePageId] : [])
      : layerSelectedIds;
  const hoveredIds = useMemo(
    () => resolveViewHoveredIds(view, hoveredLayerId, activePageId),
    [activePageId, hoveredLayerId, view]
  );
  const publishHover = view.viewHover !== 'none';

  const toggleCollapsed = useCallback(
    (id: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [setCollapsed]
  );

  const handleHoverItem = useCallback(
    (itemId: string) => {
      if (!publishHover) {
        return;
      }
      api.setHoveredLayer(itemId);
    },
    [api, publishHover]
  );

  const renderRowContent = useCallback(
    ({
      item,
      isCollapsed,
      onToggleCollapsed,
      onSelect,
    }: {
      item: ViewTreeItem;
      isCollapsed: boolean;
      onToggleCollapsed: () => void;
      onSelect: () => void;
    }) => (
      <>
        {item.hasChildren ? (
          <button
            aria-expanded={!isCollapsed}
            className={styles.treeToggle}
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapsed();
            }}
            type="button"
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span className={styles.treeToggleSpacer} />
        )}
        <TreeItemIcon icon={item.icon} />
        <button
          className={styles.treeItemLabel}
          onClick={onSelect}
          type="button"
        >
          {item.label}
        </button>
        <LockButton
          item={item}
          onSelect={onSelect}
          onToggle={() => {
            if (item.lockedCommandId) {
              void api.executeCommand(item.lockedCommandId);
            }
          }}
        />
      </>
    ),
    [api]
  );

  if (view.supportsReorder) {
    return (
      <TreeDndList
        collapsed={collapsed}
        hoveredIds={hoveredIds}
        items={view.items}
        onHoverItem={handleHoverItem}
        onMove={(source, target, position) => {
          api.moveViewItem(view.id, source, target, position);
        }}
        onSelect={(source) => api.selectViewItem(view.id, source)}
        onToggleCollapsed={toggleCollapsed}
        renderRowContent={renderRowContent}
        selectedIds={selectedIds}
        viewId={view.id}
      />
    );
  }

  return (
    <div>
      {view.items.map((item, index) => {
        if (!isItemVisible(view.items, index, collapsed)) {
          return null;
        }

        const isSelected = selectedIds.has(item.id);
        const isHovered = hoveredIds.has(item.id);
        const isCollapsed = collapsed.has(item.id);

        return (
          <StaticTreeRow
            isCollapsed={isCollapsed}
            isHovered={isHovered}
            isSelected={isSelected}
            item={item}
            key={item.id}
            onHover={() => handleHoverItem(item.id)}
            onSelect={() => api.selectViewItem(view.id, item.source)}
            onToggleCollapsed={() => toggleCollapsed(item.id)}
            onToggleLock={() => {
              if (item.lockedCommandId) {
                void api.executeCommand(item.lockedCommandId);
              }
            }}
          />
        );
      })}
    </div>
  );
}

export const ViewPanelRenderer = memo(({ viewContainers }: Props) => {
  const { api } = useWorkbenchContext();
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const hoveredLayerId = useWorkbenchContextSelector(
    (state) => state.interaction.hoveredLayerId
  );
  const activePageId = useWorkbenchContextSelector(
    (state) => state.selection.activePageId
  );
  const layerSelectedIds = useMemo(
    () => new Set(selection?.selectedLayerIds),
    [selection?.selectedLayerIds]
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const clearHover = useCallback(() => {
    api.setHoveredLayer(null);
  }, [api]);

  const handlePanelMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof Node &&
        event.currentTarget.contains(nextTarget)
      ) {
        return;
      }
      clearHover();
    },
    [clearHover]
  );

  if (viewContainers.length === 0 || !scene) {
    return null;
  }

  const resolvedActivePageId = activePageId ?? '';

  return (
    <div className={styles.viewPanel} onMouseLeave={handlePanelMouseLeave}>
      {viewContainers.map((container) => (
        <div key={container.id}>
          {container.views.map((view) => (
            <PanelSection
              collapsible={view.collapsible}
              defaultOpen={!view.initialCollapsed}
              key={view.id}
              title={view.name}
            >
              <ViewPanelBody
                activePageId={resolvedActivePageId}
                collapsed={collapsed}
                hoveredLayerId={hoveredLayerId}
                layerSelectedIds={layerSelectedIds}
                scene={scene}
                setCollapsed={setCollapsed}
                view={view}
              />
            </PanelSection>
          ))}
        </div>
      ))}
    </div>
  );
});

export { ViewPanelRenderer as TreePanelRenderer };
