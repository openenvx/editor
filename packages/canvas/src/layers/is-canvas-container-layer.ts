import { CANVAS_GROUP_LAYER_TYPE } from './canvas-group-layer';
import { WIDGET_LAYER_TYPE } from './openenvx-widget-layer';

/** Scene containers that nest children and move as a unit (group / widget). */
export function isCanvasContainerLayerType(type: string): boolean {
  return type === CANVAS_GROUP_LAYER_TYPE || type === WIDGET_LAYER_TYPE;
}
