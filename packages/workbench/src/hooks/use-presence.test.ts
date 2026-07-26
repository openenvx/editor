import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePresence } from './use-presence';

describe('usePresence', () => {
  it('stays mounted with closed state when open becomes false', () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => usePresence(open),
      { initialProps: { open: true } }
    );

    expect(result.current.present).toBe(true);
    expect(result.current.state).toBe('open');

    rerender({ open: false });
    expect(result.current.present).toBe(true);
    expect(result.current.state).toBe('closed');
  });

  it('unmounts after exit delay', async () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => usePresence(open, 20),
      { initialProps: { open: true } }
    );

    rerender({ open: false });
    expect(result.current.state).toBe('closed');
    expect(result.current.present).toBe(true);

    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 30);
      });
    });

    expect(result.current.present).toBe(false);
  });

  it('reopening before exit keeps present open', async () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => usePresence(open, 50),
      { initialProps: { open: true } }
    );

    rerender({ open: false });
    expect(result.current.state).toBe('closed');

    rerender({ open: true });
    expect(result.current.present).toBe(true);
    expect(result.current.state).toBe('open');

    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 60);
      });
    });
    expect(result.current.present).toBe(true);
    expect(result.current.state).toBe('open');
  });
});
