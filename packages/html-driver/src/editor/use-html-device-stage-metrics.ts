import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import {
  resolveFrameWidth,
  type HtmlDevicePreset,
} from './html-device-preview';

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

function applyObservedWidth(
  width: number,
  setStageWidth: (value: number | ((previous: number) => number)) => void
) {
  if (width <= 0) {
    return;
  }
  setStageWidth((previous) => {
    const next = Math.floor(width);
    return previous === next ? previous : next;
  });
}

function applyObservedHeight(
  height: number,
  setArtboardHeight: (value: number | ((previous: number) => number)) => void
) {
  if (height <= 0) {
    return;
  }
  setArtboardHeight((previous) => {
    const next = Math.ceil(height);
    return previous === next ? previous : next;
  });
}

export function useHtmlDeviceStageMetrics(preset: HtmlDevicePreset): {
  stageRef: RefObject<HTMLDivElement | null>;
  artboardRef: RefObject<HTMLDivElement | null>;
  stageWidth: number;
  artboardHeight: number;
} {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const artboardRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [artboardHeight, setArtboardHeight] = useState(0);
  const frameWidth = resolveFrameWidth(preset, stageWidth);

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) {
      return;
    }
    const applyFromElement = () => {
      const { width } = readContentBoxSize(element);
      applyObservedWidth(width, setStageWidth);
    };
    applyFromElement();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      applyObservedWidth(entry.contentRect.width, setStageWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = artboardRef.current;
    if (!element) {
      return;
    }
    const applyFromElement = () => {
      const { height } = readContentBoxSize(element);
      applyObservedHeight(height, setArtboardHeight);
    };
    applyFromElement();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      applyObservedHeight(entry.contentRect.height, setArtboardHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [frameWidth, preset]);

  return { artboardRef, artboardHeight, stageRef, stageWidth };
}
