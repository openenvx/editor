import { createContributionBuildContext } from '@openenvx/core';
import type { PropertySectionDescriptor } from '@openenvx/core';

import { LayerPropertiesPaneFactory } from '../properties/layer-properties-pane-factory';
import type {
  ViewContainerDescriptor,
  ViewDescriptor,
} from '../workbench-state';
import type { SceneSlice } from '../workbench-state-cache';
import { WORKBENCH_INSPECTOR_CONTAINER_ID } from '../workbench/inspector-container';
import { buildViewContainer } from './view-descriptor-builder';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export function buildSceneSlice(ctx: WorkbenchSliceContext): SceneSlice {
  const coreRegistries = ctx.coreRegistries;
  const workbenchRegistries = ctx.workbenchRegistries;
  const commandCtx = ctx.runtime.createCommandContext();
  const canExecuteCommand = (commandId: string) =>
    coreRegistries.commands.canExecute(commandId, commandCtx);
  const buildCtx = createContributionBuildContext(
    commandCtx.services,
    canExecuteCommand
  );
  const store = ctx.runtime.getScene();
  const scene = store.getScene();
  const selection = store.getSelection();
  const contextKeyService = ctx.runtime.getContextKeys();
  const evaluateWhen = (when: string | undefined) =>
    contextKeyService.evaluate(when);

  const properties = buildLayerProperties(ctx, commandCtx);
  const viewContainers = workbenchRegistries.viewContainers
    .filter((container) => evaluateWhen(container.when))
    .map((container) =>
      buildViewContainer(
        container,
        workbenchRegistries.views,
        ctx.providerRegistries.viewProviderRegistry,
        commandCtx,
        evaluateWhen,
        buildCtx,
        ctx.locationService
      )
    )
    .toSorted((a, b) => {
      if (a.location === b.location) {
        const order = ctx.locationService.getOrder(a.location);
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
      }
      if (a.sidebarGroup !== b.sidebarGroup) {
        return a.sidebarGroup - b.sidebarGroup;
      }
      return a.sidebarOrder - b.sidebarOrder;
    });

  const inspectorViews = buildInspectorViews(
    workbenchRegistries,
    properties,
    buildCtx,
    evaluateWhen
  );

  const fieldRenderers = ctx.providerRegistries.fieldRendererRegistry
    .entries()
    .map(([kind, Component]) => ({
      Component,
      kind,
    }));

  const viewPanels = ctx.providerRegistries.viewPanelRegistry
    .entries()
    .map(([id, Component]) => ({
      Component,
      id,
    }));

  return {
    fieldRenderers,
    properties,
    scene,
    selection,
    viewContainers: mergeInspectorViews(viewContainers, inspectorViews),
    viewPanels,
  };
}

/**
 * Selection-only patch: rebuild properties + inspector container views without
 * re-running tree providers for other containers.
 */
export function buildSelectionDerivedPatch(
  ctx: WorkbenchSliceContext,
  viewContainers: ViewContainerDescriptor[]
): Pick<SceneSlice, 'properties' | 'viewContainers'> {
  const coreRegistries = ctx.coreRegistries;
  const commandCtx = ctx.runtime.createCommandContext();
  const canExecuteCommand = (commandId: string) =>
    coreRegistries.commands.canExecute(commandId, commandCtx);
  const buildCtx = createContributionBuildContext(
    commandCtx.services,
    canExecuteCommand
  );
  const evaluateWhen = (when: string | undefined) =>
    ctx.runtime.getContextKeys().evaluate(when);

  const properties = buildLayerProperties(ctx, commandCtx);
  const inspectorViews = buildInspectorViews(
    ctx.workbenchRegistries,
    properties,
    buildCtx,
    evaluateWhen
  );

  return {
    properties,
    viewContainers: mergeInspectorViews(viewContainers, inspectorViews),
  };
}

function buildLayerProperties(
  ctx: WorkbenchSliceContext,
  commandCtx: ReturnType<
    WorkbenchSliceContext['runtime']['createCommandContext']
  >
): PropertySectionDescriptor[] | null {
  const store = ctx.runtime.getScene();
  const primaryLayer = store.getPrimaryLayer();
  if (!primaryLayer) {
    return null;
  }
  const def = ctx.coreRegistries.layers.get(primaryLayer.type);
  if (!def) {
    return null;
  }
  return def.properties(commandCtx, primaryLayer);
}

function mergeInspectorViews(
  viewContainers: ViewContainerDescriptor[],
  inspectorViews: ViewDescriptor[]
): ViewContainerDescriptor[] {
  const inspectorIndex = viewContainers.findIndex(
    (container) => container.id === WORKBENCH_INSPECTOR_CONTAINER_ID
  );
  if (inspectorIndex === -1) {
    return viewContainers;
  }

  const container = viewContainers[inspectorIndex]!;
  const staticViews = container.views.filter(
    (view) => view.content.kind !== 'properties'
  );
  const nextContainer: ViewContainerDescriptor = {
    ...container,
    views: [...staticViews, ...inspectorViews],
  };

  const next = [...viewContainers];
  next[inspectorIndex] = nextContainer;
  return next;
}

function buildInspectorViews(
  workbenchRegistries: WorkbenchSliceContext['workbenchRegistries'],
  properties: PropertySectionDescriptor[] | null,
  buildCtx: ReturnType<typeof createContributionBuildContext>,
  evaluateWhen: (when: string | undefined) => boolean
): ViewDescriptor[] {
  const panes = [
    ...workbenchRegistries.propertyPanes
      .map((pane) => pane.buildDescriptor(buildCtx))
      .filter((descriptor) => evaluateWhen(descriptor.when))
      .map((descriptor) => ({
        headerToggle: descriptor.headerToggle,
        id: descriptor.id,
        nodes: descriptor.nodes,
        priority: descriptor.priority,
        title: descriptor.title,
      })),
    ...(properties
      ? new LayerPropertiesPaneFactory()
          .build(properties)
          .map((descriptor) => ({
            headerToggle: descriptor.headerToggle,
            id: descriptor.id,
            nodes: descriptor.nodes,
            priority: descriptor.priority,
            title: descriptor.title,
          }))
      : []),
  ].toSorted((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  return panes.map((pane, index) => ({
    collapsible: true,
    containerId: WORKBENCH_INSPECTOR_CONTAINER_ID,
    content: {
      headerToggle: pane.headerToggle,
      kind: 'properties' as const,
      nodes: pane.nodes,
    },
    id: pane.id,
    initialCollapsed: false,
    name: pane.title,
    supportsReorder: false,
    viewHover: 'none' as const,
    viewOrder: pane.priority ?? index,
    viewSelection: 'layer' as const,
  }));
}
