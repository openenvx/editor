import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface CanvasThemeColors {
  artboard: string;
  artboardBorder: string;
  artboardShadow: string;
  foreground: string;
  grid: string;
  pageMargin: string;
  selection: string;
  selectionMuted: string;
  smartGuide: string;
}

const DEFAULT_COLORS: CanvasThemeColors = {
  artboard: '#ffffff',
  artboardBorder: '#e5e7eb',
  artboardShadow: 'rgba(0, 0, 0, 0.35)',
  foreground: '#ffffff',
  grid: 'rgba(0, 0, 0, 0.08)',
  pageMargin: '#a855f7',
  selection: '#3b82f6',
  selectionMuted: 'rgba(59, 130, 246, 0.75)',
  smartGuide: '#ec4899',
};

function readCanvasThemeColors(element: Element): CanvasThemeColors {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim();
    return value || fallback;
  };
  return {
    artboard: read('--canvas-artboard', DEFAULT_COLORS.artboard),
    artboardBorder: read(
      '--canvas-artboard-border',
      DEFAULT_COLORS.artboardBorder
    ),
    artboardShadow: read(
      '--canvas-artboard-shadow-color',
      DEFAULT_COLORS.artboardShadow
    ),
    foreground: read('--foreground', DEFAULT_COLORS.foreground),
    grid: read('--canvas-grid', DEFAULT_COLORS.grid),
    pageMargin: read('--canvas-page-margin', DEFAULT_COLORS.pageMargin),
    selection: read('--canvas-selection', DEFAULT_COLORS.selection),
    selectionMuted: read(
      '--canvas-selection-muted',
      DEFAULT_COLORS.selectionMuted
    ),
    smartGuide: read('--canvas-smart-guide', DEFAULT_COLORS.smartGuide),
  };
}

export function useCanvasThemeColors(
  elementRef: RefObject<HTMLElement | null>
): CanvasThemeColors {
  const [colors, setColors] = useState<CanvasThemeColors>(DEFAULT_COLORS);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    setColors(readCanvasThemeColors(element));

    const themeAncestor = element.closest('[data-owb-theme]');
    if (!themeAncestor) {
      return;
    }

    const observer = new MutationObserver(() => {
      setColors(readCanvasThemeColors(element));
    });
    observer.observe(themeAncestor, {
      attributeFilter: ['data-owb-theme'],
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return colors;
}
