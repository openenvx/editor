import { describe, expect, it } from 'vitest';

import {
  clipboardHtmlToTextModel,
  hasExternalClipboardText,
  isImageFileReference,
  isTrivialHtml,
} from './read-external-clipboard';

describe('read-external-clipboard', () => {
  it('detects text clipboard content', () => {
    expect(
      hasExternalClipboardText({
        html: '<p>Hello</p>',
        plain: 'Hello',
      })
    ).toBe(true);
  });

  it('ignores image-only clipboard metadata', () => {
    expect(
      hasExternalClipboardText({
        html: null,
        plain: null,
      })
    ).toBe(false);
  });

  it('accepts plain text without html', () => {
    expect(
      hasExternalClipboardText({
        html: null,
        plain: 'Hello',
      })
    ).toBe(true);
  });

  it('ignores image file paths in plain text', () => {
    expect(isImageFileReference('/Users/me/photo.png')).toBe(true);
    expect(
      hasExternalClipboardText({
        html: null,
        plain: '/Users/me/photo.png',
      })
    ).toBe(false);
  });

  it('treats whitespace html as trivial', () => {
    expect(isTrivialHtml('<p>   </p>')).toBe(true);
    expect(isTrivialHtml('<p>Hello</p>')).toBe(false);
  });

  it('maps html to text model with styles', () => {
    const model = clipboardHtmlToTextModel(
      '<p style="font-family: Anton; font-size: 48px; color: #ff0000; text-align: center">Hi</p>',
      'Hi'
    );
    expect(model.html).toContain('Hi');
    expect(model.fontFamily).toBe('Anton');
    expect(model.fontSize).toBe(48);
    expect(model.fill).toBe('#ff0000');
    expect(model.align).toBe('center');
  });

  it('extracts styles from nested spans and pt units', () => {
    const model = clipboardHtmlToTextModel(
      '<p><span style="font-size: 18pt; font-family: \'Canva Sans\', sans-serif; color: rgb(255, 0, 0);">Hello</span></p>',
      'Hello'
    );
    expect(model.fontFamily).toBe('Canva Sans');
    expect(model.fontSize).toBe(24);
    expect(model.fill).toBe('rgb(255, 0, 0)');
  });

  it('extracts styles from clipboard fragment markers', () => {
    const model = clipboardHtmlToTextModel(
      '<html><body><!--StartFragment--><span style="font-size: 32px; font-family: Montserrat; color: #112233">Title</span><!--EndFragment--></body></html>',
      'Title'
    );
    expect(model.fontFamily).toBe('Montserrat');
    expect(model.fontSize).toBe(32);
    expect(model.fill).toBe('#112233');
  });
});
