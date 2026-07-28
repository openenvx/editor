import { IconRegistryId } from '@openenvx/core';
import {
  ViewContainerContribution,
  ViewContribution,
  WorkbenchPlugin,
  type ViewContainerLocation,
  type WorkbenchPluginContext,
} from '@openenvx/headless';
import type { PluginPanelDeclaration } from '@xmazu/openenvxee-plugin-protocol';
import type { ComponentType, ReactNode } from 'react';

import { PluginPanel } from './plugin-panel';
import type { PluginPanelTransport } from './plugin-panel-transport';

export interface PluginPanelPluginOptions {
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
 * Registers one activity-bar panel that renders a declarative plugin tree
 * received over {@link PluginPanelTransport}.
 */
export class PluginPanelPlugin extends WorkbenchPlugin {
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

  constructor(options: PluginPanelPluginOptions) {
    super();
    this.declaration = options.declaration;
    this.transport = options.transport;
    this.templateId = options.templateId ?? null;
    this.permission = options.permission ?? 'read';
    this.theme = options.theme ?? 'dark';
    this.location = options.location ?? 'secondary';
    this.sidebarOrder = options.sidebarOrder ?? 50;
    this.id = `openenvx.plugin-panel.${options.declaration.id}`;
    this.containerId = `plugin.panel.${options.declaration.id}`;
    this.viewId = `${this.containerId}.view`;
    this.componentId = `${this.containerId}.component`;
    this.iconId = `plugin.panel.icon.${options.declaration.id}`;
  }

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    if (this.declaration.icon) {
      const registry = ctx.services.get(IconRegistryId);
      registry.register(this.iconId, createIconGlyph(this.declaration.icon));
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

    ctx.registerWorkbench(new Container(), new View());
    ctx.registerViewPanel(componentId, BoundPanel);
  }
}
