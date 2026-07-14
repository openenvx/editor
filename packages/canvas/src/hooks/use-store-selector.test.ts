// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { useStoreSelector } from '@openenvx/headless/react';
import { describe, expect, it, vi } from 'vitest';

import type { ExternalStore } from '@openenvx/core';

interface TestState {
  count: number;
  label: string;
}

function createTestStore(initial: TestState): ExternalStore<TestState> & {
  setState: (next: TestState) => void;
} {
  let snapshot = initial;
  const listeners = new Set<(state: TestState) => void>();

  return {
    getSnapshot: () => snapshot,
    setState: (next: TestState) => {
      snapshot = next;
      for (const listener of listeners) {
        listener(snapshot);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(snapshot);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

describe('useStoreSelector', () => {
  it('returns the selected slice from the store snapshot', () => {
    const store = createTestStore({ count: 1, label: 'a' });
    const { result } = renderHook(() =>
      useStoreSelector(store, (state) => state.count)
    );

    expect(result.current).toBe(1);
  });

  it('re-renders only when the selected slice changes', () => {
    const store = createTestStore({ count: 1, label: 'a' });
    const selector = vi.fn((state: TestState) => state.count);
    const { result, rerender } = renderHook(() =>
      useStoreSelector(store, selector)
    );

    expect(result.current).toBe(1);

    act(() => {
      store.setState({ count: 1, label: 'b' });
    });
    rerender();
    expect(result.current).toBe(1);

    act(() => {
      store.setState({ count: 2, label: 'b' });
    });
    rerender();
    expect(result.current).toBe(2);
  });

  it('returns null when the store is null', () => {
    const { result } = renderHook(() =>
      useStoreSelector(null, (state: TestState) => state.count)
    );

    expect(result.current).toBeNull();
  });

  it('keeps a stable object reference when isEqual reports no change', () => {
    const store = createTestStore({ count: 1, label: 'a' });
    const { result } = renderHook(() =>
      useStoreSelector(
        store,
        (state) => ({ count: state.count }),
        (a, b) => a.count === b.count
      )
    );

    const first = result.current;
    expect(first).toEqual({ count: 1 });

    act(() => {
      store.setState({ count: 1, label: 'b' });
    });

    expect(result.current).toBe(first);
  });

  it('updates when the selected object slice changes', () => {
    const store = createTestStore({ count: 1, label: 'a' });
    const { result } = renderHook(() =>
      useStoreSelector(
        store,
        (state) => ({ count: state.count }),
        (a, b) => a.count === b.count
      )
    );

    act(() => {
      store.setState({ count: 2, label: 'a' });
    });

    expect(result.current).toEqual({ count: 2 });
  });

  it('re-evaluates selector when external deps change without a store update', () => {
    const store = createTestStore({ count: 1, label: 'a' });
    let external = 10;
    const { result, rerender } = renderHook(() =>
      useStoreSelector(store, (state) => state.count + external)
    );

    expect(result.current).toBe(11);

    external = 20;
    rerender();

    expect(result.current).toBe(21);
  });
});
