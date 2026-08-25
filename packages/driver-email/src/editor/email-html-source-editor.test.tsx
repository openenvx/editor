import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmailHtmlSourceEditor } from './email-html-source-editor';

describe('EmailHtmlSourceEditor', () => {
  it('renders a read-only CodeMirror surface with the export HTML', () => {
    const html = '<html><body><p>Hello</p></body></html>';
    render(<EmailHtmlSourceEditor sourceHtml={html} />);

    expect(screen.getByTestId('email-html-source')).toBeTruthy();
    const textbox = screen.getByRole('textbox');
    expect(textbox.getAttribute('aria-readonly')).toBe('true');
    expect(textbox.textContent).toContain('Hello');
  });
});
