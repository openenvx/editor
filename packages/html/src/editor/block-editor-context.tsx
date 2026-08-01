import type { Scene } from '@openenvx/schema';
import { createContext, useContext, type ReactNode } from 'react';

import type { BlockSortDraft } from './block-dnd';

/** Inline edit target — `dataPath` is `html` for plain blocks or a dotted slot path. */
export interface BlockEditTarget {
  hostId: string;
  dataPath: string;
}

export interface BlockEditorContextValue {
  scene: Scene;
  selectedId: string | null;
  editingTarget: BlockEditTarget | null;
  sortDraft: BlockSortDraft | null;
  onSelect: (id: string) => void;
  onStartEdit: (hostId: string, dataPath: string) => void;
  onCommitEdit: (hostId: string, dataPath: string, html: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
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
