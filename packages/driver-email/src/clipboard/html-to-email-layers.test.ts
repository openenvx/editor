import { describe, expect, it } from 'vitest';

import { clipboardHtmlToEmailLayers } from './html-to-email-layers';

describe('clipboardHtmlToEmailLayers', () => {
  it('maps headings and paragraphs', () => {
    const html = `
      <h1>Title</h1>
      <p>First paragraph</p>
      <h2>Subtitle</h2>
      <p>Second <strong>bold</strong> line</p>
    `;
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      { type: 'email.heading', data: { html: 'Title', level: '1' } },
      { type: 'email.text', data: { html: 'First paragraph' } },
      { type: 'email.heading', data: { html: 'Subtitle', level: '2' } },
      {
        type: 'email.text',
        data: { html: 'Second <strong>bold</strong> line' },
      },
    ]);
  });

  it('maps lists as email.text with list markup', () => {
    const html = '<ul><li>One</li><li>Two</li></ul>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toHaveLength(1);
    expect(layers[0]?.type).toBe('email.text');
    expect(layers[0]?.data.html).toContain('<ul>');
    expect(layers[0]?.data.html).toContain('One');
  });

  it('maps https images and skips file urls', () => {
    const html =
      '<img src="https://example.com/a.png" alt="A"><img src="file:///tmp/x.png">';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      {
        type: 'email.image',
        data: { src: 'https://example.com/a.png', alt: 'A' },
      },
    ]);
  });

  it('keeps link-only paragraphs as text with anchors', () => {
    const html = '<p><a href="https://cta.example">Click me</a></p>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      {
        type: 'email.text',
        data: {
          html: '<a href="https://cta.example">Click me</a>',
        },
      },
    ]);
  });

  it('maps bold-only paragraphs to h2 headings', () => {
    const html = '<p><strong>Section title</strong></p>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      {
        type: 'email.heading',
        data: { html: '<strong>Section title</strong>', level: '2' },
      },
    ]);
  });

  it('unwraps StartFragment markers', () => {
    const html =
      '<!--StartFragment--><p>Inside fragment</p><!--EndFragment-->';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      { type: 'email.text', data: { html: 'Inside fragment' } },
    ]);
  });

  it('splits plain text on blank lines', () => {
    const layers = clipboardHtmlToEmailLayers(null, 'Line one\n\nLine two');
    expect(layers).toEqual([
      { type: 'email.text', data: { html: 'Line one' } },
      { type: 'email.text', data: { html: 'Line two' } },
    ]);
  });

  it('strips script tags via sanitizeHtml', () => {
    const html = '<p>Safe</p><script>alert(1)</script>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([{ type: 'email.text', data: { html: 'Safe' } }]);
  });

  it('returns empty for empty clipboard', () => {
    expect(clipboardHtmlToEmailLayers(null, '')).toEqual([]);
    expect(clipboardHtmlToEmailLayers('<p></p>', '')).toEqual([]);
  });

  it('maps hr to divider', () => {
    const layers = clipboardHtmlToEmailLayers('<hr>', null);
    expect(layers).toEqual([{ type: 'email.divider', data: {} }]);
  });

  it('flattens Google Docs wrapper with multiple paragraphs', () => {
    const html = `<b id="docs-internal-guid">
      <p dir="ltr"><span>Witamy!</span></p>
      <p dir="ltr"><span>Super, że jesteście z nami.</span></p>
      <p dir="ltr"><span style="font-weight:700">🎨 Dopasuj wygląd strony</span></p>
      <p dir="ltr"><span>Wybierzcie motyw i kolory.</span></p>
    </b>`;
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toHaveLength(4);
    expect(layers[0]?.type).toBe('email.text');
    expect(layers[2]?.type).toBe('email.heading');
    expect(layers[2]?.data.html).toContain('🎨');
    expect(layers[3]?.type).toBe('email.text');
  });

  it('splits a single paragraph on double line breaks', () => {
    const html = '<p>Intro<br><br>Second paragraph</p>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      { type: 'email.text', data: { html: 'Intro' } },
      { type: 'email.text', data: { html: 'Second paragraph' } },
    ]);
  });

  it('splits multiple paragraphs with double breaks without regex lastIndex bugs', () => {
    const html =
      '<p>One<br><br>Two</p><p>Three<br><br>Four</p>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      { type: 'email.text', data: { html: 'One' } },
      { type: 'email.text', data: { html: 'Two' } },
      { type: 'email.text', data: { html: 'Three' } },
      { type: 'email.text', data: { html: 'Four' } },
    ]);
  });

  it('prefers plain text when html collapses to one text block', () => {
    const html = '<p>Line one Line two</p>';
    const plain = 'Line one\n\nLine two';
    const layers = clipboardHtmlToEmailLayers(html, plain);
    expect(layers).toEqual([
      { type: 'email.text', data: { html: 'Line one' } },
      { type: 'email.text', data: { html: 'Line two' } },
    ]);
  });

  it('maps emoji-only span paragraphs to headings', () => {
    const html = '<p><span>🎨 Dopasuj wygląd strony</span></p>';
    const layers = clipboardHtmlToEmailLayers(html, null);
    expect(layers).toEqual([
      {
        type: 'email.heading',
        data: { html: '<span>🎨 Dopasuj wygląd strony</span>', level: '2' },
      },
    ]);
  });

  it('splits plain text on blank lines and emoji headings', () => {
    const plain = `Witamy!

Super, że jesteście z nami.

🎨 Dopasuj wygląd strony
Wybierzcie motyw i kolory.

https://example.com/blog/post`;
    const layers = clipboardHtmlToEmailLayers(null, plain);
    expect(layers).toHaveLength(5);
    expect(layers[0]?.type).toBe('email.text');
    expect(layers[2]?.type).toBe('email.heading');
    expect(layers[3]?.type).toBe('email.text');
    expect(layers[4]?.type).toBe('email.text');
    expect(layers[4]?.data.html).toContain('<a href="https://example.com/blog/post"');
  });
});
