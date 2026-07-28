import type { PluginContext } from '@openenvx/core';

import type { TreeDataProvider } from './contributions/view-contribution';
import type { ViewProviderRegisterOptions } from './registries/view-provider-registry';
import type { WorkbenchProviderRegistries } from './registries/workbench-provider-registries';
import {
  registerWorkbenchContribution,
  type WorkbenchContributionDisposable,
  type WorkbenchRegistries,
} from './registries/workbench-registries';
import type { WorkbenchContribution } from './workbench-contributions/workbench-contribution';

export interface WorkbenchPluginContext extends PluginContext {
  /**
   * Register workbench contributions. Returns a disposable that removes them
   * all; call after deactivate or when replacing a manifest.
   */
  registerWorkbench(
    ...contributions: WorkbenchContribution[]
  ): WorkbenchContributionDisposable;
  registerTreeDataProvider(
    viewId: string,
    provider: TreeDataProvider<unknown>,
    options?: ViewProviderRegisterOptions
  ): WorkbenchContributionDisposable;
  registerFieldRenderer(
    kind: string,
    component: unknown
  ): WorkbenchContributionDisposable;
  registerStatusBarItemRenderer(
    kind: string,
    component: unknown
  ): WorkbenchContributionDisposable;
  registerEditorPane(
    editorPaneKind: string,
    component: unknown
  ): WorkbenchContributionDisposable;
  registerViewPanel(
    componentId: string,
    component: unknown
  ): WorkbenchContributionDisposable;
}

export interface CreateWorkbenchPluginContextOptions {
  /** Fired after workbench contributions are registered or disposed. */
  onContributionsChanged?: () => void;
  /** Collect disposables for activate/deactivate tracking. */
  trackDisposable?: (disposable: WorkbenchContributionDisposable) => void;
}

export function createWorkbenchPluginContext(
  base: PluginContext,
  workbenchRegistries: WorkbenchRegistries,
  providerRegistries: WorkbenchProviderRegistries,
  options?: CreateWorkbenchPluginContextOptions
): WorkbenchPluginContext {
  const onContributionsChanged = options?.onContributionsChanged;
  const trackDisposable = options?.trackDisposable;

  const track = (
    disposable: WorkbenchContributionDisposable
  ): WorkbenchContributionDisposable => {
    trackDisposable?.(disposable);
    return disposable;
  };

  return {
    commands: base.commands,
    contextKeys: base.contextKeys,
    editor: base.editor,
    events: base.events,
    register: base.register.bind(base),
    registerWorkbench(
      ...contributions: WorkbenchContribution[]
    ): WorkbenchContributionDisposable {
      const disposables = contributions.map((contribution) =>
        registerWorkbenchContribution(workbenchRegistries, contribution)
      );
      onContributionsChanged?.();
      return track({
        dispose: () => {
          for (const disposable of disposables) {
            disposable.dispose();
          }
          onContributionsChanged?.();
        },
      });
    },
    registerTreeDataProvider(viewId, provider, registerOptions) {
      providerRegistries.viewProviderRegistry.registerTreeDataProvider(
        viewId,
        provider,
        registerOptions
      );
      onContributionsChanged?.();
      return track({
        dispose: () => {
          providerRegistries.viewProviderRegistry.unregisterTreeDataProvider(
            viewId,
            provider
          );
          onContributionsChanged?.();
        },
      });
    },
    registerFieldRenderer(kind, component) {
      providerRegistries.fieldRendererRegistry.register(kind, component);
      onContributionsChanged?.();
      return track({
        dispose: () => {
          providerRegistries.fieldRendererRegistry.unregister(kind);
          onContributionsChanged?.();
        },
      });
    },
    registerStatusBarItemRenderer(kind, component) {
      providerRegistries.statusBarItemRendererRegistry.register(
        kind,
        component
      );
      onContributionsChanged?.();
      return track({
        dispose: () => {
          providerRegistries.statusBarItemRendererRegistry.unregister(kind);
          onContributionsChanged?.();
        },
      });
    },
    registerEditorPane(editorPaneKind, component) {
      providerRegistries.editorPaneRegistry.register(editorPaneKind, component);
      onContributionsChanged?.();
      return track({
        dispose: () => {
          providerRegistries.editorPaneRegistry.unregister(editorPaneKind);
          onContributionsChanged?.();
        },
      });
    },
    registerViewPanel(componentId, component) {
      providerRegistries.viewPanelRegistry.register(componentId, component);
      onContributionsChanged?.();
      return track({
        dispose: () => {
          providerRegistries.viewPanelRegistry.unregister(componentId);
          onContributionsChanged?.();
        },
      });
    },
    scene: base.scene,
    services: base.services,
  };
}
