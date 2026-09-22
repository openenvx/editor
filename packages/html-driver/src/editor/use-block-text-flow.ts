import { ContextKeyServiceId, getActiveArtboard } from '@openenvx/studio';
import { useWorkbenchContext } from '@openenvx/studio/react';
import { useCallback, useRef, useState } from 'react';

import type { BlockRegistry } from '../block-registry';
import { findBlock, siblingCount } from '../tree/block-tree';
import { findAdjacentTextBlockId } from '../tree/text-block-navigation';
import type { BlockEditTarget } from './block-editor-context';
import {
  alignDataPathFromHtmlPath,
  type RichTextAlign,
} from './rich-text-align';
import type { RichTextBoundary, RichTextCaret } from './rich-text-boundary';

export interface UseBlockTextFlowOptions {
  /** Command id prefix, e.g. `html` → `html.insertBlock`. */
  prefix: string;
  /** Block type inserted on Enter-at-end, e.g. `html.text`. */
  textBlockType: string;
  registry: BlockRegistry;
}

function parentAcceptsChildren(
  registry: BlockRegistry,
  layers: Parameters<typeof findBlock>[0],
  parentId: string | null
): boolean {
  if (!parentId) {
    return false;
  }
  const parent = findBlock(layers, parentId);
  if (!parent) {
    return false;
  }
  return registry.get(parent.block.type)?.acceptsChildren === true;
}

export function useBlockTextFlow({
  prefix,
  textBlockType,
  registry,
}: UseBlockTextFlowOptions): {
  editingTarget: BlockEditTarget | null;
  onStartEdit: (
    hostId: string,
    dataPath: string,
    caret?: RichTextCaret
  ) => void;
  onCommitEdit: (
    hostId: string,
    dataPath: string,
    html: string,
    align?: RichTextAlign
  ) => void;
  onBoundary: (intent: RichTextBoundary) => boolean;
  clearEditing: () => void;
} {
  const { api, executeCommand } = useWorkbenchContext();
  const [editingTarget, setEditingTarget] = useState<BlockEditTarget | null>(
    null
  );
  const editingTargetRef = useRef(editingTarget);
  editingTargetRef.current = editingTarget;

  const setEditingText = useCallback(
    (value: boolean) => {
      api
        .getService(ContextKeyServiceId)
        ?.setContext('editor.editingText', value);
    },
    [api]
  );

  const beginEdit = useCallback(
    (hostId: string, dataPath: string, caret?: RichTextCaret) => {
      const next: BlockEditTarget = { hostId, dataPath, caret };
      editingTargetRef.current = next;
      setEditingText(true);
      setEditingTarget(next);
    },
    [setEditingText]
  );

  const clearEditing = useCallback(() => {
    editingTargetRef.current = null;
    setEditingText(false);
    setEditingTarget(null);
  }, [setEditingText]);

  const onStartEdit = useCallback(
    (hostId: string, dataPath: string, caret?: RichTextCaret) => {
      beginEdit(hostId, dataPath, caret);
    },
    [beginEdit]
  );

  const onCommitEdit = useCallback(
    (hostId: string, dataPath: string, html: string, align?: RichTextAlign) => {
      if (align !== undefined) {
        api.updateProperties(hostId, {
          [dataPath]: html,
          [alignDataPathFromHtmlPath(dataPath)]: align,
        });
      } else {
        api.updateProperty(hostId, dataPath, html);
      }
      const current = editingTargetRef.current;
      if (current?.hostId !== hostId || current.dataPath !== dataPath) {
        return;
      }
      clearEditing();
    },
    [api, clearEditing]
  );

  const onBoundary = useCallback(
    (intent: RichTextBoundary) => {
      const target = editingTargetRef.current;
      if (!target || target.dataPath !== 'html') {
        return false;
      }
      const snap = api.getSnapshot();
      const page = getActiveArtboard(
        snap.scene,
        snap.selection.activeArtboardId
      );
      const found = findBlock(page.nodes, target.hostId);
      if (!found) {
        return false;
      }

      if (intent.kind === 'insertAfter') {
        if (!parentAcceptsChildren(registry, page.nodes, found.parentId)) {
          return false;
        }
        api.updateProperty(target.hostId, target.dataPath, intent.html);
        // ponytail: pattern blocks (email.header, …) give positional meaning
        // to child order - same risk as DnD reorder; no extra guard.
        void executeCommand(`${prefix}.insertBlock`, {
          type: textBlockType,
          parentId: found.parentId,
          index: found.index + 1,
        }).then((ok) => {
          if (!ok) {
            return;
          }
          const nextId = api.getSnapshot().selection.primaryNodeId;
          if (!nextId) {
            return;
          }
          beginEdit(nextId, 'html', 'start');
        });
        return true;
      }

      if (intent.kind === 'deleteEmpty') {
        if (siblingCount(page.nodes, found.parentId) <= 1) {
          return false;
        }
        const prevId = findAdjacentTextBlockId(
          page.nodes,
          registry,
          target.hostId,
          'prev'
        );
        const nextId = prevId
          ? null
          : findAdjacentTextBlockId(
              page.nodes,
              registry,
              target.hostId,
              'next'
            );
        void executeCommand(`${prefix}.removeBlock`, {
          id: target.hostId,
        }).then((ok) => {
          if (!ok) {
            return;
          }
          const neighbour = prevId ?? nextId;
          if (!neighbour) {
            clearEditing();
            return;
          }
          beginEdit(neighbour, 'html', prevId ? 'end' : 'start');
        });
        return true;
      }

      const direction = intent.kind === 'focusPrev' ? 'prev' : 'next';
      const neighbourId = findAdjacentTextBlockId(
        page.nodes,
        registry,
        target.hostId,
        direction
      );
      if (!neighbourId) {
        return false;
      }
      api.updateProperty(target.hostId, target.dataPath, intent.html);
      beginEdit(neighbourId, 'html', direction === 'prev' ? 'end' : 'start');
      return true;
    },
    [
      api,
      beginEdit,
      clearEditing,
      executeCommand,
      prefix,
      registry,
      textBlockType,
    ]
  );

  return {
    editingTarget,
    onStartEdit,
    onCommitEdit,
    onBoundary,
    clearEditing,
  };
}
