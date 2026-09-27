import { applyWidgetFace } from '@openenvx/editor-sandbox/canvas-widget';
import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@openenvx/editor-sandbox/host';
import type { DocumentNode } from '@openenvx/studio';

import { setOpenEnvxWidgetClickHandler } from './interactions/widget-click-handler';

/** Sandbox host wired for canvas widget faces. */
export function createCanvasSandboxExtensionHost(
  options: Omit<
    SandboxExtensionHostOptions,
    'applyWidgetFace' | 'bindWidgetClick'
  >
): SandboxExtensionHost {
  return new SandboxExtensionHost({
    ...options,
    applyWidgetFace: (layer, tree) =>
      applyWidgetFace(layer as DocumentNode, tree),
    bindWidgetClick: setOpenEnvxWidgetClickHandler,
  });
}
