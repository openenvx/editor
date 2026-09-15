import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmailHtmlPreview } from './email-html-preview';

describe('EmailHtmlPreview', () => {
  it('renders an iframe with sandbox and the export HTML as srcDoc', () => {
    const html = '<html><body><p>Hello</p></body></html>';
    const markup = renderToStaticMarkup(<EmailHtmlPreview html={html} />);
    expect(markup).toContain('title="Email preview"');
    expect(markup).toContain('sandbox="allow-same-origin"');
    expect(markup).toContain('srcDoc=');
  });
});
