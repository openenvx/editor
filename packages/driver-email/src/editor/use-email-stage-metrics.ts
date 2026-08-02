import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

function readContentBoxSize(element: HTMLElement): {
  width: number;
  height: number;
} {
  const style = getComputedStyle(element);
  const paddingX =
    (Number.parseFloat(style.paddingLeft) || 0) +
    (Number.parseFloat(style.paddingRight) || 0);
  const paddingY =
    (Number.parseFloat(style.paddingTop) || 0) +
    (Number.parseFloat(style.paddingBottom) || 0);
  return {
    width: element.clientWidth - paddingX,
    height: element.clientHeight - paddingY,
  };
}

export function useEmailStageMetrics(): {
  stageRef: RefObject<HTMLDivElement | null>;
  artboardRef: RefObject<HTMLDivElement | null>;
  stageWidth: number;
  artboardHeight: number;
} {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const artboardRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [artboardHeight, setArtboardHeight] = useState(0);

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }
    const apply = () => {
      const { width } = readContentBoxSize(element);
      if (width <= 0) {
        return;
      }
      setStageWidth((previous) => {
        const next = Math.floor(width);
        return previous === next ? previous : next;
      });
    };
    apply();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const width = entry.contentRect.width;
      if (width <= 0) {
        return;
      }
      setStageWidth((previous) => {
        const next = Math.floor(width);
        return previous === next ? previous : next;
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = artboardRef.current;
    if (!element) {
      return;
    }
    const apply = () => {
      const { height } = readContentBoxSize(element);
      if (height <= 0) {
        return;
      }
      setArtboardHeight((previous) => {
        const next = Math.ceil(height);
        return previous === next ? previous : next;
      });
    };
    apply();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const height = entry.contentRect.height;
      if (height <= 0) {
        return;
      }
      setArtboardHeight((previous) => {
        const next = Math.ceil(height);
        return previous === next ? previous : next;
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { artboardRef, artboardHeight, stageRef, stageWidth };
}
