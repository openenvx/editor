import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Tracks an element's content box via ResizeObserver.
 * Ignores transient 0×0 updates so layout toggles (e.g. rulers) don't
 * wipe the stage size when the observed node briefly reports empty.
 */
export function useContainerSize<T extends HTMLElement>(): [
  RefObject<T | null>,
  ContainerSize,
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ContainerSize>({ height: 0, width: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const applySize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) {
        return;
      }
      setSize((previous) => {
        const nextWidth = Math.floor(width);
        const nextHeight = Math.floor(height);
        if (previous.width === nextWidth && previous.height === nextHeight) {
          return previous;
        }
        return { height: nextHeight, width: nextWidth };
      });
    };

    applySize(element.clientWidth, element.clientHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      applySize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
