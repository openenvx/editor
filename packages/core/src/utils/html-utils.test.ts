import { describe, expect, it } from 'vitest';

import { escapeAttr, escapeHtml, sanitizeHtml } from './html-utils';

describe('html-utils', () => {
  it('escapes html entities', () => {
    expect(escapeHtml('<script>"&')).toBe('&lt;script&gt;&quot;&amp;');
    expect(escapeAttr('a"b')).toBe('a&quot;b');
  });

  it('strips script tags and event handlers', () => {
    const input = '<p onclick="alert(1)">Hi</p><script>alert(1)</script>';
    expect(sanitizeHtml(input)).toBe('<p>Hi</p>');
  });

  it('blocks javascript hrefs', () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    expect(sanitizeHtml(input)).toBe('<a>link</a>');
  });

  it('keeps safe formatting tags', () => {
    const input = '<p><strong>Bold</strong> text</p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('keeps strike and underline tags', () => {
    const input = '<p><s>Strike</s> and <u>underline</u></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });
});
