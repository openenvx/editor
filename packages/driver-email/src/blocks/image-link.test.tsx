import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { imageLinkBlock } from './image-link';

describe('imageLinkBlock', () => {
  it('renders an inline-block Link wrapping Img', () => {
    const node = imageLinkBlock.render?.({
      data: {
        src: 'https://placehold.co/36x36',
        alt: 'X',
        href: 'https://example.com/',
        width: 18,
        height: 18,
      },
      children: null,
    });
    const html = renderToStaticMarkup(node as ReactElement);
    expect(html).toContain('display:inline-block');
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain('alt="X"');
    expect(html).toContain('width="18"');
  });
});
