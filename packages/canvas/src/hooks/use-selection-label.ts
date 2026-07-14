import type Konva from 'konva';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';

import type { SelectionBounds } from '../canvas-stage-types';

export interface UseSelectionLabelInput {
  artboardOffset: { x: number; y: number };
  selectedPrimary: string | null;
  selectedTransform: {
    height: number;
    width: number;
    x: number;
    y: number;
  } | null;
  transformerRef: RefObject<Konva.Transformer | null>;
  vpZoom: number;
}

export function useSelectionLabel({
  artboardOffset,
  selectedPrimary,
  selectedTransform,
  transformerRef,
  vpZoom,
}: UseSelectionLabelInput) {
  const sizeLabelRef = useRef<Konva.Label>(null);
  const [selectionLabelBounds, setSelectionLabelBounds] =
    useState<SelectionBounds | null>(null);
  const [sizeLabelOffsetX, setSizeLabelOffsetX] = useState(0);

  const syncLabelFromTransformer = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer || transformer.nodes().length === 0) {
      return;
    }
    const rect = transformer.getClientRect();
    setSelectionLabelBounds({
      height: rect.height / vpZoom,
      width: rect.width / vpZoom,
      x: (rect.x - artboardOffset.x) / vpZoom,
      y: (rect.y - artboardOffset.y) / vpZoom,
    });
  }, [artboardOffset.x, artboardOffset.y, transformerRef, vpZoom]);

  const updateSizeLabelImperatively = useCallback((bounds: SelectionBounds) => {
    const label = sizeLabelRef.current;
    if (!label) {
      return;
    }
    label.position({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height + 6,
    });
    const text = label.findOne('Text') as Konva.Text | undefined;
    text?.text(`${Math.round(bounds.width)} × ${Math.round(bounds.height)} px`);
    label.getLayer()?.batchDraw();
  }, []);

  useEffect(() => {
    if (!selectedTransform) {
      setSelectionLabelBounds(null);
      return;
    }
    setSelectionLabelBounds({
      height: selectedTransform.height,
      width: selectedTransform.width,
      x: selectedTransform.x,
      y: selectedTransform.y,
    });
  }, [selectedTransform]);

  useEffect(() => {
    if (!selectedPrimary) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      syncLabelFromTransformer();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [selectedPrimary, syncLabelFromTransformer]);

  const sizeLabelText = selectionLabelBounds
    ? `${Math.round(selectionLabelBounds.width)} × ${Math.round(selectionLabelBounds.height)} px`
    : '';

  useLayoutEffect(() => {
    const label = sizeLabelRef.current;
    if (!label) {
      return;
    }
    const nextOffsetX = label.width() / 2;
    setSizeLabelOffsetX((current) =>
      current === nextOffsetX ? current : nextOffsetX
    );
  }, [sizeLabelText]);

  return {
    selectionLabelBounds,
    setSelectionLabelBounds,
    sizeLabelOffsetX,
    sizeLabelRef,
    sizeLabelText,
    syncLabelFromTransformer,
    updateSizeLabelImperatively,
  };
}
