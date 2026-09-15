import type { LayerPreviewDescriptor } from '@openenvx/core/preview';
import { memo } from 'react';
import type { ComponentType } from 'react';
import { Rect } from 'react-konva';

import type { CanvasLayerRendererHostProps } from './contributions/canvas-layer-renderer-contribution';
import type { CanvasLayerRendererRegistration } from './registry/canvas-registry-types';
import { PlaceholderCanvasRenderer } from './renderers/placeholder-canvas-renderer';

export interface CanvasLayerContentProps {
  view: LayerPreviewDescriptor;
  width: number;
  height: number;
  hidden?: boolean;
  canvasLayerRenderers: CanvasLayerRendererRegistration[];
  fontLoadRevision?: number;
}

export const CanvasLayerContent = memo(
  ({
    view,
    width,
    height,
    hidden = false,
    canvasLayerRenderers,
    fontLoadRevision = 0,
  }: CanvasLayerContentProps) => {
    if (hidden) {
      return <Rect fill="transparent" height={height} width={width} />;
    }

    const registration = canvasLayerRenderers.find(
      (entry) => entry.kind === view.kind
    );
    const Renderer =
      (registration?.Component as ComponentType<CanvasLayerRendererHostProps>) ??
      PlaceholderCanvasRenderer;

    return (
      <Renderer
        fontLoadRevision={fontLoadRevision}
        hidden={hidden}
        height={height}
        view={view}
        width={width}
      />
    );
  }
);
