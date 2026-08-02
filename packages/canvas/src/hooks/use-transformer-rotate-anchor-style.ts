import type Konva from 'konva';
import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

import { refreshTransformer } from '../canvas-transformer-utils';
import {
  loadRotateAnchorImage,
  styleTransformerRotateAnchor,
} from '../transformer-rotate-anchor';

/**
 * Loads the Lucide-style rotate handle image for the current selection color
 * and returns an `anchorStyleFunc` for Konva.Transformer.
 */
export function useTransformerRotateAnchorStyle(
  strokeColor: string,
  transformerRef: RefObject<Konva.Transformer | null>
): (anchor: Konva.Rect) => void {
  const [icon, setIcon] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadRotateAnchorImage(strokeColor)
      .then((image) => {
        if (!cancelled) {
          setIcon(image);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIcon(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [strokeColor]);

  useEffect(() => {
    refreshTransformer(transformerRef.current);
  }, [icon, transformerRef]);

  return useCallback(
    (anchor: Konva.Rect) => {
      styleTransformerRotateAnchor(anchor, icon);
    },
    [icon]
  );
}
