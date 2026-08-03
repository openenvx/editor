import { describe, expect, it } from 'vitest';

import {
  buttonBlock,
  columnBlock,
  headingBlock,
  imageBlock,
  rowBlock,
  sectionBlock,
  textBlock,
} from './builtin-blocks';

describe('email block chromeDisplay', () => {
  it('keeps contents chrome only on email.column (table cell structure)', () => {
    expect(columnBlock.chromeDisplay).toBe('contents');
    expect(sectionBlock.chromeDisplay).toBeUndefined();
    expect(rowBlock.chromeDisplay).toBeUndefined();
    expect(textBlock.chromeDisplay).toBeUndefined();
    expect(headingBlock.chromeDisplay).toBeUndefined();
    expect(imageBlock.chromeDisplay).toBeUndefined();
    expect(buttonBlock.chromeDisplay).toBeUndefined();
  });

  it('renders email.button with align Section wrapper (selection menu stays)', () => {
    const node = buttonBlock.render?.({
      data: buttonBlock.defaultData,
    });
    // Outer wrapper is react-email Section (displayName "Section")
    expect((node?.type as { displayName?: string })?.displayName).toBe(
      'Section'
    );
  });
});
