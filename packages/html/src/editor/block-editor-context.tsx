import type { Scene } from '@openenvx/schema';
import { createContext, useContext, type ReactNode } from 'react';

import type { BlockSortDraft } from './block-dnd';
import type { RichTextAlign } from './rich-text-align';

/** Inline edit target — `dataPath` is `html` for plain blocks or a dotted slot path. */
export interface BlockEditTarget {
  hostId: string;
  dataPath: string;
}

/**
 * Slot (or non-primary) image field override for the selection-pill Replace
 * action. When null, the selected host uses its primary image field.
 */
export interface BlockImageTarget {
  layerId: string;
  fieldPath: string;
}

export interface BlockEditorContextValue {
  scene: Scene;
  selectedId: string | null;
  /** Canvas-style hover outline + Layers tree sync. */
  hoveredLayerId: string | null;
  editingTarget: BlockEditTarget | null;
  sortDraft: BlockSortDraft | null;
  /** True when AssetService.upload is available. */
  canReplaceImage: boolean;
  /**
   * Non-primary image path override (e.g. slot `src`). Cleared when selection
   * moves to another layer; host chrome click also clears back to primary.
   */
  imageOverride: BlockImageTarget | null;
  setImageOverride: (target: BlockImageTarget | null) => void;
  onSelect: (id: string) => void;
  onHoverLayer: (id: string | null) => void;
  onStartEdit: (hostId: string, dataPath: string) => void;
  onCommitEdit: (
    hostId: string,
    dataPath: string,
    html: string,
    align?: RichTextAlign
  ) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  /** Upload file via AssetService and write ref to layer fieldPath. */
  onReplaceImage: (
    layerId: string,
    fieldPath: string,
    file: File
  ) => void | Promise<void>;
  resolveAssetUrl: (ref: string) => string;
}

const BlockEditorContext = createContext<BlockEditorContextValue | null>(null);

export function BlockEditorProvider({
  value,
  children,
}: {
  value: BlockEditorContextValue;
  children: ReactNode;
}) {
  return (
    <BlockEditorContext.Provider value={value}>
      {children}
    </BlockEditorContext.Provider>
  );
}

export function useBlockEditor(): BlockEditorContextValue {
  const value = useContext(BlockEditorContext);
  if (!value) {
    throw new Error('useBlockEditor must be used within BlockEditorProvider');
  }
  return value;
}
