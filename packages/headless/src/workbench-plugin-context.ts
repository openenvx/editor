import type { PluginContext } from '@openenvx/core';

import type { TreeDataProvider } from './contributions/view-contribution';
import type { ViewProviderRegisterOptions } from './registries/view-provider-registry';
import type { WorkbenchProviderRegistries } from './registries/workbench-provider-registries';
import {
  registerWorkbenchContribution,
  type WorkbenchRegistries,
} from './registries/workbench-registries';
import type { WorkbenchContribution } from './workbench-contributions/workbench-contribution';

export interface WorkbenchPluginContext extends PluginContext {
  registerWorkbench(...contributions: WorkbenchContribution[]): void;
  registerTreeDataProvider(
    viewId: string,
    provider: TreeDataProvider<unknown>,
    options?: ViewProviderRegisterOptions
  ): void;
  registerFieldRenderer(kind: string, component: unknown): void;
  registerStatusBarItemRenderer(kind: string, component: unknown): void;
  registerEditorPane(editorPaneKind: string, component: unknown): void;
  registerViewPanel(componentId: string, component: unknown): void;
}

export function createWorkbenchPluginContext(
  base: PluginContext,
  workbenchRegistries: WorkbenchRegistries,
  providerRegistries: WorkbenchProviderRegistries
): WorkbenchPluginContext {
  return {
    commands: base.commands,
    contextKeys: base.contextKeys,
    editor: base.editor,
    events: base.events,
    register: base.register.bind(base),
    registerWorkbench(...contributions: WorkbenchContribution[]): void {
      for (const contribution of contributions) {
        registerWorkbenchContribution(workbenchRegistries, contribution);
      }
    },
    registerTreeDataProvider(viewId, provider, options) {
      providerRegistries.viewProviderRegistry.registerTreeDataProvider(
        viewId,
        provider,
        options
      );
    },
    registerFieldRenderer(kind, component) {
      providerRegistries.fieldRendererRegistry.register(kind, component);
    },
    registerStatusBarItemRenderer(kind, component) {
      providerRegistries.statusBarItemRendererRegistry.register(
        kind,
        component
      );
    },
    registerEditorPane(editorPaneKind, component) {
      providerRegistries.editorPaneRegistry.register(editorPaneKind, component);
    },
    registerViewPanel(componentId, component) {
      providerRegistries.viewPanelRegistry.register(componentId, component);
    },
    scene: base.scene,
    services: base.services,
  };
}
