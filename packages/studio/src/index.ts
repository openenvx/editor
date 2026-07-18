import { AgentChatPlugin } from '@openenvx/agent';
import { CanvasBasicsPlugin } from '@openenvx/canvas';
import { DriverImagePlugin } from '@openenvx/driver-image';
import {
  CanvasLayersPlugin,
  CanvasPagesPlugin,
  CanvasProPlugin,
  CanvasSidebarPlugin,
  CanvasTemplatePlugin,
} from '@xmazu/openenvxee-canvas-pro';

export * from '@openenvx/core';
export * from '@openenvx/headless';
export * from '@xmazu/openenvxee-workbench';
export * from '@openenvx/canvas';
export * from '@xmazu/openenvxee-canvas-pro';
export * from '@openenvx/agent';
export * from '@openenvx/driver-image';

/**
 * Default plugin set for a full OpenEnvx Studio host app
 * (canvas basics + image driver + canvas-pro chrome + agent).
 */
export const DEFAULT_STUDIO_PLUGINS = [
  new CanvasBasicsPlugin(),
  new DriverImagePlugin(),
  new CanvasProPlugin(),
  new CanvasSidebarPlugin(),
  new CanvasPagesPlugin(),
  new CanvasLayersPlugin(),
  new CanvasTemplatePlugin(),
  new AgentChatPlugin(),
];
