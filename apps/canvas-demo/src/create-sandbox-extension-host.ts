import {
  applyWidgetFace,
  CanvasPlugin,
  setOpenEnvxWidgetClickHandler,
  WIDGET_LAYER_TYPE,
} from '@openenvx/canvas';
import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@openenvx/workbench';

/**
 * Demo-local sandbox factory — wires canvas widget click handler + layer type.
 */
export function createSandboxExtensionHost(
  options: Omit<
    SandboxExtensionHostOptions,
    'bindWidgetClick' | 'widgetLayerType' | 'applyWidgetFace'
  >
): SandboxExtensionHost {
  return new SandboxExtensionHost({
    widgetLayerType: WIDGET_LAYER_TYPE,
    bindWidgetClick: (handler) => setOpenEnvxWidgetClickHandler(handler),
    applyWidgetFace: (layer, tree) => applyWidgetFace(layer, tree),
    ...options,
  });
}

export const DEFAULT_STUDIO_PLUGINS = [new CanvasPlugin()];
