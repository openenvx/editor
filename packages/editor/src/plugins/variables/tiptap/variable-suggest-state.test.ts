import type { Editor } from '@tiptap/react';
import { describe, expect, it, vi } from 'vitest';

import {
  detectVariableSuggest,
  filterVariableSuggestions,
  insertVariableTokenAtSuggest,
  isRichTextBlurInsideVariableChrome,
} from './variable-suggest-state';

describe('variable-suggest-state', () => {
  it('detectVariableSuggest matches {{ trigger at caret', () => {
    const editor = {
      state: {
        selection: { from: 10, empty: true },
        doc: {
          textBetween: () => 'Hello {{te',
        },
      },
      view: {
        coordsAtPos: () => ({ bottom: 120, left: 40 }),
      },
    } as unknown as Editor;

    const anchor = detectVariableSuggest(editor);
    expect(anchor).toMatchObject({
      filter: 'te',
      from: 6,
      to: 10,
      top: 124,
      left: 40,
    });
  });

  it('detectVariableSuggest ignores {{ inside an existing {{{key}}} token', () => {
    const editor = {
      state: {
        selection: { from: 14, empty: true },
        doc: {
          textBetween: () => 'Hi {{{name}}',
        },
      },
      view: {
        coordsAtPos: () => ({ bottom: 120, left: 40 }),
      },
    } as unknown as Editor;

    expect(detectVariableSuggest(editor)).toBeNull();
  });

  it('filterVariableSuggestions filters by key prefix', () => {
    const variables = [
      { id: 'v1', key: 'test' },
      { id: 'v2', key: 'title' },
      { id: 'v3', key: 'other' },
    ];
    expect(filterVariableSuggestions(variables, 't')).toEqual([
      variables[0],
      variables[1],
    ]);
  });

  it('insertVariableTokenAtSuggest replaces trigger with token', () => {
    const run = vi.fn();
    const chain = {
      focus: vi.fn(() => chain),
      deleteRange: vi.fn(() => chain),
      insertContent: vi.fn(() => chain),
      run,
    };
    const editor = {
      chain: vi.fn(() => chain),
    } as unknown as Editor;

    insertVariableTokenAtSuggest(
      editor,
      { filter: 'te', from: 6, to: 10, top: 0, left: 0 },
      'test'
    );

    expect(chain.deleteRange).toHaveBeenCalledWith({ from: 6, to: 10 });
    expect(chain.insertContent).toHaveBeenCalledWith('{{{test}}}');
    expect(run).toHaveBeenCalled();
  });

  it('isRichTextBlurInsideVariableChrome detects picker and dialog', () => {
    const suggest = document.createElement('div');
    suggest.dataset.openenvxVariableSuggest = '';
    const button = document.createElement('button');
    suggest.append(button);

    expect(isRichTextBlurInsideVariableChrome(button)).toBe(true);
    expect(isRichTextBlurInsideVariableChrome(document.body)).toBe(false);
  });
});
