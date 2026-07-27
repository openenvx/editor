import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  BlockEditorProvider,
  useBlockEditor,
} from './block-editor-context';
import type { BlockEditorContextValue } from './block-editor-context';

afterEach(cleanup);

describe('BlockEditorProvider', () => {
  it('provides context values to consumers', () => {
    const value = {
      scene: { pages: [], schemaVersion: 1 },
      selectedId: 'a',
      editingBlockId: null,
      sortDraft: null,
      onSelect: () => {},
      onStartEdit: () => {},
      onCommitEdit: () => {},
      onDuplicate: () => {},
      onRemove: () => {},
    } as unknown as BlockEditorContextValue;

    const { result } = renderHook(() => useBlockEditor(), {
      wrapper: ({ children }) => (
        <BlockEditorProvider value={value}>{children}</BlockEditorProvider>
      ),
    });

    expect(result.current.selectedId).toBe('a');
  });

  it('throws outside the provider', () => {
    expect(() => renderHook(() => useBlockEditor())).toThrow(
      /useBlockEditor must be used within BlockEditorProvider/
    );
  });
});
