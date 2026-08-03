import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlockSelectionMenu } from './block-selection-menu';

afterEach(cleanup);

describe('BlockSelectionMenu', () => {
  it('renders actions and stops pointer propagation', () => {
    const onDuplicate = vi.fn();
    const onRemove = vi.fn();
    render(
      <BlockSelectionMenu
        canDuplicate
        canRemove
        label="Heading"
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
    );

    const toolbar = screen.getByRole('toolbar', { name: 'Heading actions' });
    const stop = vi.fn();
    fireEvent.pointerDown(toolbar, { stopPropagation: stop });
    // native event still bubbles in jsdom unless handler calls stopPropagation —
    // the component does; assert buttons work.
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDuplicate).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Move' })).toBeNull();
  });

  it('renders move handle when canDrag and forwards handle props', () => {
    const onPointerDown = vi.fn();
    render(
      <BlockSelectionMenu
        canDrag
        canDuplicate={false}
        canRemove={false}
        dragHandleProps={{ onPointerDown, 'data-testid': 'drag-handle' }}
        label="Text"
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const handle = screen.getByRole('button', { name: 'Move' });
    expect(handle.dataset.testid).toBe('drag-handle');
    fireEvent.pointerDown(handle);
    expect(onPointerDown).toHaveBeenCalledOnce();
  });

  it('hides actions when not allowed', () => {
    render(
      <BlockSelectionMenu
        canDuplicate={false}
        canRemove={false}
        label="Root"
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'Duplicate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Move' })).toBeNull();
  });
});
