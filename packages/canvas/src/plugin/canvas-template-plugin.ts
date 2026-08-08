import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import { TemplateDataPanel } from '../components/template-data-panel';
import {
  TEMPLATE_DATA_PANEL_COMPONENT_ID,
  CanvasTemplateContainer,
  CanvasTemplateView,
} from '../contributions/canvas-template-contribution';

export class CanvasTemplatePlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.canvas.template';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(
      new CanvasTemplateContainer(),
      new CanvasTemplateView()
    );
    ctx.registerViewPanel(TEMPLATE_DATA_PANEL_COMPONENT_ID, TemplateDataPanel);
  }
}
