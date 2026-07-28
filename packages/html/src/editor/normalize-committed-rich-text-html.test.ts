import { describe, expect, it } from 'vitest';

import { normalizeCommittedRichTextHtml } from './normalize-committed-rich-text-html';

describe('normalizeCommittedRichTextHtml', () => {
  it('unwraps a solitary TipTap paragraph', () => {
    expect(normalizeCommittedRichTextHtml('<p>Welcome</p>')).toBe('Welcome');
    expect(
      normalizeCommittedRichTextHtml('<p>Hello <strong>there</strong></p>')
    ).toBe('Hello <strong>there</strong>');
  });

  it('keeps multi-paragraph HTML', () => {
    expect(normalizeCommittedRichTextHtml('<p>A</p><p>B</p>')).toBe(
      '<p>A</p><p>B</p>'
    );
  });

  it('trims and passes through bare text', () => {
    expect(normalizeCommittedRichTextHtml('  Welcome  ')).toBe('Welcome');
  });
});
