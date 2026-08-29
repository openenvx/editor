import type { Layer } from '@openenvx/core';
import {
  applyHtmlWidgetFace,
  setOpenEnvxHtmlWidgetClickHandler,
} from '@openenvx/html';
import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@openenvx/workbench';

/** Demo-local sandbox factory — wires HTML widget click handler + face applicator. */
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
