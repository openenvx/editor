import type {
  EmbedPanelHostSurface,
  ViewContainerLocation,
  WorkbenchApi,
} from '@openenvx/headless';
import {
  ViewContainerContribution,
  ViewContribution,
} from '@openenvx/headless';
import type { PluginPanelDeclaration } from '@xmazu/openenvxee-plugin-protocol';
import type { ComponentType, ReactNode } from 'react';

import { PluginPanel } from './plugin-panel';
import type { PluginPanelTransport } from './plugin-panel-transport';

export interface EmbedPanelHostOptions {
  declaration: PluginPanelDeclaration;
  transport: PluginPanelTransport;
  templateId?: string | null;
  permission?: 'read' | 'edit';
  theme?: string;
  location?: ViewContainerLocation;
  sidebarOrder?: number;
}

function createIconGlyph(
  src: string
): ComponentType<{ size?: number; className?: string }> {
  return function PluginPanelIcon({
    size = 16,
    className,
  }: {
    size?: number;
    className?: string;
  }): ReactNode {
    return (
      <img
        alt=""
        className={className}
        height={size}
        src={src}
        style={{ display: 'block', objectFit: 'contain' }}
        width={size}
      />
    );
  };
}

/**
 * External embed panel host — not a WorkbenchPlugin / PluginManager citizen.
 * Mount via {@link mountEmbedPanel} on a narrow {@link EmbedPanelHostSurface}.
 */
export class EmbedPanelHost {
  readonly id: string;

  private readonly declaration: PluginPanelDeclaration;
  private readonly transport: PluginPanelTransport;
  private readonly templateId: string | null;
  private readonly permission: 'read' | 'edit';
  private readonly theme: string;
  private readonly location: ViewContainerLocation;
  private readonly sidebarOrder: number;
  private readonly containerId: string;
  private readonly viewId: string;
  private readonly componentId: string;
  private readonly iconId: string;
  private mounted = false;
  private readonly surfaceDisposables: { dispose(): void }[] = [];

  constructor(options: EmbedPanelHostOptions) {
    this.declaration = options.declaration;
    this.transport = options.transport;
    this.templateId = options.templateId ?? null;
    this.permission = options.permission ?? 'read';
    this.theme = options.theme ?? 'dark';
    this.location = options.location ?? 'secondary';
    this.sidebarOrder = options.sidebarOrder ?? 50;
    this.id = `openenvx.embed-panel.${options.declaration.id}`;
    this.containerId = `openenvx.embed-panel.${options.declaration.id}`;
    this.viewId = `${this.containerId}.view`;
    this.componentId = `${this.containerId}.component`;
    this.iconId = `openenvx.embed-panel.icon.${options.declaration.id}`;
  }

  mount(surface: EmbedPanelHostSurface): void {
    if (this.mounted) {
      throw new Error(`EmbedPanelHost already mounted: ${this.id}`);
    }
    this.mounted = true;

    if (this.declaration.icon) {
      this.surfaceDisposables.push(
        surface.registerIcon(
          this.iconId,
          createIconGlyph(this.declaration.icon)
        )
      );
    }

    const declaration = this.declaration;
    const transport = this.transport;
    const templateId = this.templateId;
    const permission = this.permission;
    const theme = this.theme;
    const containerId = this.containerId;
    const viewId = this.viewId;
    const componentId = this.componentId;
    const icon = this.declaration.icon ? this.iconId : 'sparkles';
    const title = this.declaration.title;
    const location = this.location;
    const sidebarOrder = this.sidebarOrder;

    class Container extends ViewContainerContribution {
      readonly id = containerId;
      readonly title = title;
      readonly icon = icon;
      readonly sidebarBehavior = 'panel' as const;
      readonly defaultLocation = location;
      readonly sidebarOrder = sidebarOrder;
    }

    class View extends ViewContribution {
      readonly id = viewId;
      readonly containerId = containerId;
      readonly name = title;
      readonly componentId = componentId;
      readonly collapsible = false;
      readonly viewOrder = 0;
    }

    const BoundPanel = function BoundPanel() {
      return (
        <PluginPanel
          declaration={declaration}
          permission={permission}
          templateId={templateId}
          theme={theme}
          transport={transport}
        />
      );
    };

    this.surfaceDisposables.push(
      surface.registerWorkbench(new Container(), new View())
    );
    this.surfaceDisposables.push(
      surface.registerViewPanel(componentId, BoundPanel)
    );
  }

  dispose(): void {
    for (const disposable of this.surfaceDisposables.splice(0)) {
      disposable.dispose();
    }
    this.mounted = false;
  }
}

/** Mount an embed panel host via WorkbenchApi (not PluginManager). */
export function mountEmbedPanel(
  api: Pick<WorkbenchApi, 'mountEmbedPanelHost'>,
  host: EmbedPanelHost
): () => void {
  return api.mountEmbedPanelHost((surface) => {
    host.mount(surface);
    return () => host.dispose();
  });
}
