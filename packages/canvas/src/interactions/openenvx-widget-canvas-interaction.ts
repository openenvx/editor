import { CanvasLayerInteractionContribution } from '../contributions/canvas-layer-interaction-contribution';
import { WIDGET_LAYER_TYPE } from '../layers/openenvx-widget-layer';
import { emitOpenEnvxWidgetClick } from './widget-click-handler';

/**
 * Routes canvas pointer clicks on widget nodes to the sandbox host
 * (Figma: widgets run in response to user interaction on the object).
 */
export class OpenEnvxWidgetCanvasInteraction extends CanvasLayerInteractionContribution {
  readonly kind = WIDGET_LAYER_TYPE;

  onClick(layerId: string): void {
    emitOpenEnvxWidgetClick(layerId);
  }
}
