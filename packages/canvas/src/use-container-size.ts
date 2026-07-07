import { useEffect, useRef, useState } from 'react';

export interface ContainerSize {
  width: number;
  height: number;
}

export function useContainerSize<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  ContainerSize,
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ContainerSize>({ height: 0, width: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      setSize({ height: Math.floor(height), width: Math.floor(width) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
