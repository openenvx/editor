import {
  ViewContainerContribution,
  ViewContribution,
  WorkbenchPlugin,
  VersionHistoryProviderId,
  type ViewContainerLocation,
  type VersionHistoryProvider,
  type WorkbenchPluginContext,
} from '@openenvx/headless';

import { RestoreVersionCommand } from './restore-version-command';
import { VersionHistoryPanel } from './version-history-panel';

export const VERSION_HISTORY_CONTAINER_ID = 'workbench.versionHistory';
export const VERSION_HISTORY_VIEW_ID = 'workbench.versionHistory.panel';
export const VERSION_HISTORY_PANEL_COMPONENT_ID =
  'workbench.versionHistory.panel';
export const VERSION_HISTORY_PLUGIN_ID = 'openworkbench.version-history';

export interface VersionHistoryPluginOptions {
  provider: VersionHistoryProvider;
  containerTitle?: string;
  location?: ViewContainerLocation;
  sidebarOrder?: number;
}

class VersionHistoryContainer extends ViewContainerContribution {
  readonly id = VERSION_HISTORY_CONTAINER_ID;
  readonly title: string;
  readonly defaultLocation: ViewContainerLocation;
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarOrder: number;

  constructor(
    title: string,
    location: ViewContainerLocation,
    sidebarOrder: number
  ) {
    super();
    this.title = title;
    this.defaultLocation = location;
    this.sidebarOrder = sidebarOrder;
  }
}

class VersionHistoryView extends ViewContribution {
  readonly id = VERSION_HISTORY_VIEW_ID;
  readonly containerId = VERSION_HISTORY_CONTAINER_ID;
  readonly name = 'Version history';
  readonly componentId = VERSION_HISTORY_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
}

/**
 * Registers the Version History secondary sidebar panel and host provider.
 *
 * ```ts
 * new VersionHistoryPlugin({
 *   provider: {
 *     listVersions: (uri) => backend.list(uri),
 *     loadVersion: (uri, id) => backend.load(uri, id),
 *   },
 * })
 * ```
 */
export class VersionHistoryPlugin extends WorkbenchPlugin {
  readonly id = VERSION_HISTORY_PLUGIN_ID;

  private readonly provider: VersionHistoryProvider;
  private readonly containerTitle: string;
  private readonly location: ViewContainerLocation;
  private readonly sidebarOrder: number;

  constructor(options: VersionHistoryPluginOptions) {
    super();
    this.provider = options.provider;
    this.containerTitle = options.containerTitle ?? 'Version';
    this.location = options.location ?? 'secondary';
    this.sidebarOrder = options.sidebarOrder ?? 10;
  }

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.services.registerInstance(VersionHistoryProviderId, this.provider);
    ctx.registerWorkbench(
      new VersionHistoryContainer(
        this.containerTitle,
        this.location,
        this.sidebarOrder
      ),
      new VersionHistoryView()
    );
    ctx.registerViewPanel(
      VERSION_HISTORY_PANEL_COMPONENT_ID,
      VersionHistoryPanel
    );
    ctx.register(new RestoreVersionCommand());
  }
}
