import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@openenvx/editor-sandbox/host';
import type { Layer } from '@openenvx/studio/core';

import { setOpenEnvxHtmlWidgetClickHandler } from '../editor/html-widget-click-handler';
import { applyHtmlWidgetFace } from '../widgets/map-widget-tree-to-html-layers';

/** Sandbox host wired for HTML widget faces. */
export function createHtmlSandboxExtensionHost(
  options: Omit<
    SandboxExtensionHostOptions,
    'applyWidgetFace' | 'bindWidgetClick'
  >
): SandboxExtensionHost {
  return new SandboxExtensionHost({
    ...options,
    applyWidgetFace: (layer, tree) => applyHtmlWidgetFace(layer as Layer, tree),
    bindWidgetClick: setOpenEnvxHtmlWidgetClickHandler,
  });
}
