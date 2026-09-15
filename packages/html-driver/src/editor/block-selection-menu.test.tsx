import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlockSelectionMenu } from './block-selection-menu';

afterEach(cleanup);

function mockRect(
  el: HTMLElement,
  top: number,
  left: number,
  width: number,
  height: number
) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      top,
      left,
      bottom: top + height,
      right: left + width,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }),
  });
}

function MenuHarness({
  children,
  top = 80,
  left = 40,
  width = 120,
  height = 120,
}: {
  children: (anchor: HTMLElement) => ReactNode;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={(node) => {
        if (!node) {
          setAnchor(null);
          return;
        }
        mockRect(node, top, left, width, height);
        setAnchor(node);
      }}
      style={{ position: 'absolute', top, left, width, height }}
    >
      {anchor ? children(anchor) : null}
    </div>
  );
}

describe('BlockSelectionMenu', () => {
  it('portals the toolbar to document.body', () => {
    const onDuplicate = vi.fn();
    const onRemove = vi.fn();
    render(
      <MenuHarness>
        {(anchor) => (
          <BlockSelectionMenu
            anchor={anchor}
            canDuplicate
            canRemove
            label="Heading"
            onDuplicate={onDuplicate}
            onRemove={onRemove}
          />
        )}
      </MenuHarness>
    );

    const toolbar = screen.getByRole('toolbar', { name: 'Heading actions' });
    expect(toolbar.parentElement).toBe(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDuplicate).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Move' })).toBeNull();
  });

  it('renders move handle when canDrag and forwards handle props', () => {
    const onPointerDown = vi.fn();
    render(
      <MenuHarness>
        {(anchor) => (
          <BlockSelectionMenu
            anchor={anchor}
            canDrag
            canDuplicate={false}
            canRemove={false}
            dragHandleProps={{ onPointerDown, 'data-testid': 'drag-handle' }}
            label="Text"
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        )}
      </MenuHarness>
    );

    const handle = screen.getByRole('button', { name: 'Move' });
    expect(handle.dataset.testid).toBe('drag-handle');
    fireEvent.pointerDown(handle);
    expect(onPointerDown).toHaveBeenCalledOnce();
  });

  it('hides actions when not allowed', () => {
    render(
      <MenuHarness>
        {(anchor) => (
          <BlockSelectionMenu
            anchor={anchor}
            canDuplicate={false}
            canRemove={false}
            label="Root"
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        )}
      </MenuHarness>
    );
    expect(screen.queryByRole('button', { name: 'Duplicate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Move' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Replace image' })
    ).toBeNull();
  });

  it('shows Replace image and forwards the chosen file', () => {
    const onReplaceImage = vi.fn();
    render(
      <MenuHarness>
        {(anchor) => (
          <BlockSelectionMenu
            anchor={anchor}
            canDuplicate={false}
            canRemove={false}
            canReplaceImage
            label="Image"
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
            onReplaceImage={onReplaceImage}
          />
        )}
      </MenuHarness>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Replace image' }));
    const input = document.body.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onReplaceImage).toHaveBeenCalledWith(file);
  });

  it('hides when the anchor is mostly scrolled off-screen', async () => {
    render(
      <MenuHarness height={120} top={-200}>
        {(anchor) => (
          <BlockSelectionMenu
            anchor={anchor}
            canDuplicate={false}
            canRemove={false}
            label="Event page"
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        )}
      </MenuHarness>
    );

    await vi.waitFor(() => {
      expect(
        screen.queryByRole('toolbar', { name: 'Event page actions' })
      ).toBeNull();
    });
  });

  it('pushes under a floating toolbar while staying near the block top', async () => {
    const toolbar = document.createElement('div');
    toolbar.dataset.owbEditorToolbar = 'top-center';
    mockRect(toolbar, 0, 0, 800, 48);
    document.body.append(toolbar);

    try {
      render(
        <MenuHarness height={400} left={400} top={80} width={120}>
          {(anchor) => (
            <BlockSelectionMenu
              anchor={anchor}
              canDuplicate={false}
              canRemove={false}
              label="Event page"
              onDuplicate={vi.fn()}
              onRemove={vi.fn()}
            />
          )}
        </MenuHarness>
      );

      const pill = await screen.findByRole('toolbar', {
        name: 'Event page actions',
      });
      await vi.waitFor(() => {
        const top = Number.parseFloat(pill.style.top);
        expect(top).toBeGreaterThanOrEqual(48 + 8 + 40);
        expect(top).toBeLessThan(200);
      });
    } finally {
      toolbar.remove();
    }
  });
});
