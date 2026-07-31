import type { WorkbenchContributionDisposable } from '../registries/workbench-registries';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';

/**
 * Narrow host surface for declarative embed panels.
 * Deliberately omits InstantiationService / PluginContext.
 */
export interface EmbedPanelHostSurface {
  registerWorkbench(
    ...contributions: WorkbenchContribution[]
  ): WorkbenchContributionDisposable;
  registerViewPanel(
    componentId: string,
    component: unknown
  ): WorkbenchContributionDisposable;
  registerIcon(id: string, glyph: unknown): WorkbenchContributionDisposable;
}
