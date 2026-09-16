import { LayerDefinition, OpenEnvxWidgetLayer } from '@openenvx/studio/core';

import { CanvasCircleLayer } from './canvas-circle-layer';
import { CanvasGroupLayer } from './canvas-group-layer';
import { CanvasImageLayer } from './canvas-image-layer';
import { CanvasInstanceLayer } from './canvas-instance-layer';
import { CanvasQrLayer } from './canvas-qr-layer';
import { CanvasRectLayer } from './canvas-rect-layer';
import { CanvasSvgLayer } from './canvas-svg-layer';
import { CanvasTextLayer } from './canvas-text-layer';

/** Canonical built-in canvas layer definitions for plugin registration and headless export. */
export function builtinCanvasLayerDefinitions(): LayerDefinition[] {
  return [
    new CanvasTextLayer(),
    new CanvasImageLayer(),
    new CanvasSvgLayer(),
    new CanvasQrLayer(),
    new CanvasRectLayer(),
    new CanvasCircleLayer(),
    new CanvasGroupLayer(),
    new CanvasInstanceLayer(),
    new OpenEnvxWidgetLayer(),
  ];
}
