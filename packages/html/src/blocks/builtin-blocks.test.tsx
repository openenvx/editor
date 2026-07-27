import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  flexBlock,
  gridBlock,
  headingBlock,
  imageBlock,
  isHtmlTextBlockType,
  legacyContainerBlock,
  rootBlock,
  textBlock,
} from './builtin-blocks';

afterEach(cleanup);

describe('builtinBlocks', () => {
  it('renders heading levels h1–h4', () => {
    const { rerender } = render(
      headingBlock.render({ data: { html: 'Title', level: '1' } })
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Title');

    rerender(headingBlock.render({ data: { html: 'Title', level: '2' } }));
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();

    rerender(headingBlock.render({ data: { html: 'Title', level: '3' } }));
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();

    rerender(headingBlock.render({ data: { html: 'Title', level: '4' } }));
    expect(screen.getByRole('heading', { level: 4 })).toBeTruthy();

    rerender(headingBlock.render({ data: { html: 'Title' } }));
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });

  it('renders text, image, and container blocks', () => {
    const { unmount } = render(
      textBlock.render({ data: { html: '<p>Paragraph</p>' } })
    );
    expect(document.body.textContent).toContain('Paragraph');
    unmount();

    render(
      imageBlock.render({
        data: { src: 'https://example.com/a.png', alt: 'Alt' },
      })
    );
    const img = screen.getByRole('img', { name: 'Alt' });
    expect(img.getAttribute('src')).toBe('https://example.com/a.png');
  });

  it('renders flex, grid, container, and root with children', () => {
    const child = <span>Child</span>;

    const { rerender, unmount } = render(
      flexBlock.render({
        data: {
          direction: 'column',
          justify: 'center',
          gap: 8,
          wrap: 'false',
          paddingY: 4,
        },
        children: child,
      })
    );
    expect(screen.getByText('Child')).toBeTruthy();

    rerender(
      gridBlock.render({
        data: { columns: 3, gap: 12, paddingY: 2 },
        children: child,
      })
    );
    expect(screen.getByText('Child')).toBeTruthy();

    rerender(
      legacyContainerBlock.render({
        data: { padding: 8, background: '#eee' },
        children: child,
      })
    );
    expect(screen.getByText('Child')).toBeTruthy();

    rerender(
      rootBlock.render({
        data: { background: '#fff' },
        children: child,
      })
    );
    expect(screen.getByText('Child')).toBeTruthy();
    unmount();
  });

  it('classifies text block types', () => {
    expect(isHtmlTextBlockType('html.heading')).toBe(true);
    expect(isHtmlTextBlockType('html.text')).toBe(true);
    expect(isHtmlTextBlockType('html.image')).toBe(false);
  });

  it('clamps invalid grid columns', () => {
    const { container } = render(
      gridBlock.render({ data: { columns: 0 }, children: null })
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.gridTemplateColumns).toContain('repeat(2');
  });

  it('renders with default data when fields are missing', () => {
    const { rerender, unmount } = render(headingBlock.render({ data: {} }));
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();

    rerender(textBlock.render({ data: {} }));
    expect(document.body.innerHTML).toBeTruthy();

    rerender(imageBlock.render({ data: {} }));
    expect(document.querySelector('img')).toBeTruthy();

    rerender(flexBlock.render({ data: {}, children: <span>x</span> }));
    expect(screen.getByText('x')).toBeTruthy();

    rerender(gridBlock.render({ data: { columns: 99 }, children: null }));
    const grid = document.querySelector(
      '[style*="grid-template-columns"]'
    ) as HTMLElement;
    expect(grid.style.gridTemplateColumns).toContain('repeat(12');

    rerender(legacyContainerBlock.render({ data: {} }));
    rerender(rootBlock.render({ data: {} }));
    unmount();
  });
});
