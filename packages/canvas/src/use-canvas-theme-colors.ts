import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface CanvasThemeColors {
  artboard: string;
  artboardBorder: string;
  artboardShadow: string;
  foreground: string;
  pageMargin: string;
  selection: string;
  smartGuide: string;
}

const DEFAULT_COLORS: CanvasThemeColors = {
  artboard: '#ffffff',
  artboardBorder: '#e5e7eb',
  artboardShadow: 'rgba(0, 0, 0, 0.35)',
  foreground: '#ffffff',
  pageMargin: '#a855f7',
  selection: '#3b82f6',
  smartGuide: '#ec4899',
};

function readCanvasThemeColors(element: Element): CanvasThemeColors {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim();
    return value || fallback;
  };
  return {
    artboard: read('--wb-artboard', DEFAULT_COLORS.artboard),
    artboardBorder: read('--wb-artboard-border', DEFAULT_COLORS.artboardBorder),
    artboardShadow: read(
      '--wb-artboard-shadow-color',
      DEFAULT_COLORS.artboardShadow
    ),
    foreground: read('--wb-foreground', DEFAULT_COLORS.foreground),
    pageMargin: read('--wb-page-margin', DEFAULT_COLORS.pageMargin),
    selection: read('--wb-selection', DEFAULT_COLORS.selection),
    smartGuide: read('--wb-smart-guide', DEFAULT_COLORS.smartGuide),
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
