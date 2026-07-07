import type { LayerPreviewDescriptor } from '@openenvx/preview';
import { isLayerWritable } from '@openenvx/core';
import type { Layer } from '@openenvx/schema';
import { createDefaultTransform } from '@openenvx/schema';
import { memo, useMemo } from 'react';

import { computeArtboardOffset } from '../artboard-offset';
import type { CanvasLayerInteractionRegistration } from '../registry/canvas-registry-types';
import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from '../rich-text-typography';
import type { ViewportState } from '../viewport';
import { CanvasRichTextEditor } from './canvas-rich-text-editor';
import {
  getLayerScreenBounds,
  getLayerScreenStyle,
} from './layer-screen-bounds';

import styles from './canvas-editor.module.css';

export interface CanvasRichTextOverlayLayer {
  layer: Layer;
  view: LayerPreviewDescriptor;
}

export interface CanvasRichTextOverlayProps {
  layers: CanvasRichTextOverlayLayer[];
  containerWidth: number;
  containerHeight: number;
  artboardWidth: number;
  artboardHeight: number;
  viewport: ViewportState;
  editingLayerId: string | null;
  canvasLayerInteractions?: CanvasLayerInteractionRegistration[];
  onCommitEdit: (layerId: string, html: string) => void;
}

export const CanvasRichTextOverlay = memo(
  ({
    layers,
    containerWidth,
    containerHeight,
    artboardWidth,
    artboardHeight,
    viewport,
    editingLayerId,
    onCommitEdit,
  }: CanvasRichTextOverlayProps) => {
    const artboardOffset = useMemo(
      () =>
        computeArtboardOffset(
          containerWidth,
          containerHeight,
          artboardWidth,
          artboardHeight,
          viewport.zoom,
          viewport.panX,
          viewport.panY
        ),
      [
        artboardHeight,
        artboardWidth,
        containerHeight,
        containerWidth,
        viewport.panX,
        viewport.panY,
        viewport.zoom,
      ]
    );

    const editingPayload = useMemo(() => {
      if (containerWidth <= 0 || containerHeight <= 0 || !editingLayerId) {
        return null;
      }

      const editingLayer = layers.find(
        ({ layer }) => layer.id === editingLayerId
      );
      if (!editingLayer || editingLayer.view.kind !== 'richText') {
        return null;
      }
      if (!isLayerWritable(editingLayer.layer)) {
        return null;
      }

      const { layer, view } = editingLayer;
      const richTextView = view as Extract<
        LayerPreviewDescriptor,
        { kind: 'richText' }
      >;
      const transform = layer.transform ?? createDefaultTransform();
      const fontSize = richTextView.fontSize ?? DEFAULT_RICH_TEXT_FONT_SIZE;
      const fontFamily =
        richTextView.fontFamily ?? DEFAULT_RICH_TEXT_FONT_FAMILY;
      const fill = richTextView.fill ?? DEFAULT_RICH_TEXT_FILL;
      const align = richTextView.align ?? 'left';
      const lineHeight =
        richTextView.lineHeight ?? RICH_TEXT_LINE_HEIGHT_MULTIPLIER;
      const letterSpacing =
        richTextView.letterSpacing ?? DEFAULT_RICH_TEXT_LETTER_SPACING;
      const bounds = getLayerScreenBounds(transform, viewport, artboardOffset);

      return {
        align,
        fill,
        fontFamily,
        fontSize,
        html: richTextView.html,
        layer,
        layerStyle: getLayerScreenStyle(bounds),
        letterSpacing,
        lineHeight,
      };
    }, [
      artboardOffset,
      containerHeight,
      containerWidth,
      editingLayerId,
      layers,
      viewport,
    ]);

    if (!editingPayload) {
      return null;
    }

    const {
      align,
      fill,
      fontFamily,
      fontSize,
      html,
      layer,
      layerStyle,
      letterSpacing,
      lineHeight,
    } = editingPayload;

    return (
      <div className={styles.overlay}>
        <div
          className={styles.layer}
          key={layer.id}
          style={{
            ...layerStyle,
            pointerEvents: 'auto',
          }}
        >
          <CanvasRichTextEditor
            align={align}
            fill={fill}
            fontFamily={fontFamily}
            fontSize={fontSize}
            html={html}
            letterSpacing={letterSpacing}
            lineHeight={lineHeight}
            onCommit={(nextHtml) => onCommitEdit(layer.id, nextHtml)}
            zoom={viewport.zoom}
          />
        </div>
      </div>
    );
  }
);
