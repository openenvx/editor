import { afterEach, describe, expect, it } from 'vitest';

import {
  EMAIL_FONT_FAMILY,
  EMAIL_FONT_WOFF2_URL,
  emailFontStack,
  emailHeadingStyle,
  ensureEmailDocumentFont,
} from './email-document-font';

afterEach(() => {
  document.querySelector('#openenvx-email-document-font')?.remove();
});

describe('email-document-font', () => {
  it('builds the Inter + web-safe stack', () => {
    expect(emailFontStack()).toBe('Inter, Arial, Helvetica, sans-serif');
    expect(EMAIL_FONT_FAMILY).toBe('Inter');
  });

  it('pins heading metrics independent of UA defaults', () => {
    expect(emailHeadingStyle(1)).toEqual({
      fontSize: 28,
      fontWeight: 600,
      lineHeight: '1.3',
    });
    expect(emailHeadingStyle(2).fontSize).toBe(22);
    expect(emailHeadingStyle(3).fontWeight).toBe(600);
  });

  it('injects host @font-face for 400/600/700 once', () => {
    ensureEmailDocumentFont();
    ensureEmailDocumentFont();
    const styles = document.querySelectorAll('#openenvx-email-document-font');
    expect(styles).toHaveLength(1);
    const css = styles[0]?.textContent ?? '';
    expect(css).toContain(EMAIL_FONT_WOFF2_URL);
    expect(css).toContain('font-weight: 400');
    expect(css).toContain('font-weight: 600');
    expect(css).toContain('font-weight: 700');
  });
});
