import { useWorkbenchContextSelector } from '@openenvx/core/react';
import type { TemplateVariable } from '@openenvx/core/schema';
import type { Editor } from '@tiptap/react';
import { useCallback, useRef, useState, type RefObject } from 'react';

import {
  detectVariableSuggest,
  filterVariableSuggestions,
  insertVariableTokenAtSuggest,
  type VariableSuggestAnchor,
  type VariableTokenCatalog,
} from './tiptap';
import type { VariableSuggestMenuProps } from './variable-suggest-menu';

export interface UseVariableRichTextSuggestOptions {
  sceneVariables: TemplateVariable[];
  missingTip: string;
  pickerTitle: string;
  createVariable: string;
  executeCommand: (
    commandId: string,
    args?: unknown
  ) => void | Promise<void | boolean>;
}

export interface VariableRichTextSuggestMenuProps extends Omit<
  VariableSuggestMenuProps,
  'anchor' | 'variables'
> {
  anchor: VariableSuggestAnchor;
  variables: TemplateVariable[];
}

export function useVariableRichTextSuggest({
  sceneVariables,
  missingTip,
  pickerTitle,
  createVariable,
  executeCommand,
}: UseVariableRichTextSuggestOptions) {
  const canCreateVariable =
    useWorkbenchContextSelector(
      (state) => state.commandStates['variables.create']?.canExecute ?? false
    ) ?? false;
  const canEditVariable =
    useWorkbenchContextSelector((state) =>
      Boolean(state.commandStates['variables.edit'])
    ) ?? false;
  const catalogRef = useRef<VariableTokenCatalog>({
    variables: [],
    missingTip: '',
  });
  const suggestRef = useRef<VariableSuggestAnchor | null>(null);
  const suggestDismissedRef = useRef(false);
  const highlightRef = useRef(0);
  const [suggestAnchor, setSuggestAnchor] =
    useState<VariableSuggestAnchor | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);

  catalogRef.current = { variables: sceneVariables, missingTip };

  const syncSuggestFromEditor = useCallback((activeEditor: Editor) => {
    if (suggestDismissedRef.current) {
      setSuggestAnchor(null);
      suggestRef.current = null;
      return;
    }
    const next = detectVariableSuggest(activeEditor);
    suggestRef.current = next;
    setSuggestAnchor(next);
    if (next) {
      highlightRef.current = 0;
      setHighlightIndex(0);
    }
  }, []);

  const dismissSuggest = useCallback(() => {
    suggestDismissedRef.current = true;
    suggestRef.current = null;
    setSuggestAnchor(null);
  }, []);

  const pickVariable = useCallback((activeEditor: Editor, key: string) => {
    const anchor = suggestRef.current;
    if (!anchor) {
      return;
    }
    insertVariableTokenAtSuggest(activeEditor, anchor, key);
    suggestDismissedRef.current = false;
    suggestRef.current = null;
    setSuggestAnchor(null);
  }, []);

  const handleSuggestKeyDown = useCallback(
    (
      event: KeyboardEvent,
      editorRef: RefObject<Editor | null>,
      options?: { stopPropagationOnSuggestEscape?: boolean }
    ): boolean => {
      const suggest = suggestRef.current;
      const suggestions = suggest
        ? filterVariableSuggestions(
            catalogRef.current.variables,
            suggest.filter
          )
        : [];

      if (suggest && suggestions.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const next = (highlightRef.current + 1) % suggestions.length;
          highlightRef.current = next;
          setHighlightIndex(next);
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const next =
            (highlightRef.current - 1 + suggestions.length) %
            suggestions.length;
          highlightRef.current = next;
          setHighlightIndex(next);
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const picked = suggestions[highlightRef.current];
          const activeEditor = editorRef.current;
          if (picked && activeEditor) {
            pickVariable(activeEditor, picked.key);
          }
          return true;
        }
      }

      if (event.key === 'Escape' && suggest) {
        event.preventDefault();
        if (options?.stopPropagationOnSuggestEscape) {
          event.stopPropagation();
        }
        dismissSuggest();
        return true;
      }

      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        suggestDismissedRef.current = false;
      }

      return false;
    },
    [dismissSuggest, pickVariable]
  );

  const createPickHandler = useCallback(
    (editor: Editor | null) => (key: string) => {
      if (!editor) {
        return;
      }
      pickVariable(editor, key);
    },
    [pickVariable]
  );

  const createMenuProps = useCallback(
    (editor: Editor | null): VariableRichTextSuggestMenuProps | null => {
      if (!suggestAnchor) {
        return null;
      }
      return {
        anchor: suggestAnchor,
        createLabel: createVariable,
        highlightedIndex: highlightIndex,
        title: pickerTitle,
        variables: filterVariableSuggestions(
          sceneVariables,
          suggestAnchor.filter
        ),
        onCreate: () => {
          dismissSuggest();
          void executeCommand('variables.create');
        },
        onEdit: (id: string) => {
          dismissSuggest();
          void executeCommand('variables.edit', { id });
        },
        onHighlight: (index: number) => {
          highlightRef.current = index;
          setHighlightIndex(index);
        },
        onPick: createPickHandler(editor),
        showCreate: canCreateVariable,
        showEdit: canEditVariable,
      };
    },
    [
      canCreateVariable,
      canEditVariable,
      createPickHandler,
      createVariable,
      dismissSuggest,
      executeCommand,
      highlightIndex,
      pickerTitle,
      sceneVariables,
      suggestAnchor,
    ]
  );

  return {
    catalogRef,
    createMenuProps,
    dismissSuggest,
    handleSuggestKeyDown,
    isSuggestOpen: () => suggestRef.current !== null,
    resetSuggestDismissed: () => {
      suggestDismissedRef.current = false;
    },
    suggestRef,
    syncSuggestFromEditor,
  };
}
