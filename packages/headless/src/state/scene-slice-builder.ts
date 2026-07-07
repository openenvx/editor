import {
  createContributionBuildContext,
  getPrimaryLayer,
} from '@openenvx/core';
import type { PropertySectionDescriptor } from '@openenvx/core';

import { LayerPropertiesPaneFactory } from '../inspector/layer-properties-pane-factory';
import type { SceneSlice } from '../workbench-state-cache';
import { buildViewContainer } from './view-descriptor-builder';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export function buildSceneSlice(ctx: WorkbenchSliceContext): SceneSlice {
  const registries = ctx.manager.getRegistries();
  const commandCtx = ctx.manager.createCommandContext();
  const canExecuteCommand = (commandId: string) =>
    registries.commands.canExecute(commandId, commandCtx);
  const buildCtx = createContributionBuildContext(
    commandCtx.services,
    canExecuteCommand
  );
  const scene = ctx.sceneStore.getScene();
  const contextKeyService = ctx.manager.getContextKeys();
  const evaluateWhen = (when: string | undefined) =>
    contextKeyService.evaluate(when);

  const primaryLayer = getPrimaryLayer(scene);
  let properties: PropertySectionDescriptor[] | null = null;
  if (primaryLayer) {
    const def = registries.layers.get(primaryLayer.type);
    if (def) {
      properties = def.properties(commandCtx, primaryLayer);
    }
  }

  const viewContainers = registries.viewContainers
    .map((container) =>
      buildViewContainer(
        container,
        registries.views,
        commandCtx,
        evaluateWhen,
        buildCtx
      )
    )
    .toSorted((a, b) => a.sidebarOrder - b.sidebarOrder);

  const inspectorPanes = [
    ...registries.inspectorPanes
      .map((pane) => pane.buildDescriptor(buildCtx))
      .filter((descriptor) => evaluateWhen(descriptor.when))
      .map((descriptor) => ({
        id: descriptor.id,
        nodes: descriptor.nodes,
        priority: descriptor.priority,
        title: descriptor.title,
      })),
    ...(properties
      ? new LayerPropertiesPaneFactory()
          .build(properties)
          .map((descriptor) => ({
            id: descriptor.id,
            nodes: descriptor.nodes,
            priority: descriptor.priority,
            title: descriptor.title,
          }))
      : []),
  ].toSorted((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const fieldRenderers = registries.fieldRenderers.map((renderer) => ({
    Component: renderer.Component,
    kind: renderer.kind,
  }));

  return {
    fieldRenderers,
    inspectorPanes,
    properties,
    scene,
    selection: scene.selection,
    viewContainers,
  };
}
