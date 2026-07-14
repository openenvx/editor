import {
  getActivePage,
  getLayerChildren,
  resolveEditorPaneKind,
} from '@openenvx/core';
import type { Layer } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import { resolveLayerPreview } from '../utils/layer-preview-resolver';
import type { EditorSlice } from '../workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

interface LayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: LayerSurfaceItem[];
}

export class EditorSliceBuilder {
  build(ctx: WorkbenchSliceContext): EditorSlice {
    const coreRegistries = ctx.manager.getRegistries();
    const commandCtx = ctx.manager.createCommandContext();
    const scene = ctx.sceneStore.getScene();
    const editor = ctx.editorService.getActiveEditor();
    const activePage = getActivePage(scene);
    const selectedIds = new Set(scene.selection.selectedLayerIds);

    const buildSurfaceItem = (layer: Layer): LayerSurfaceItem => {
      const def = coreRegistries.layers.get(layer.type);
      const previewCtx = {
        isSelected: selectedIds.has(layer.id),
        layerId: layer.id,
        model: def ? def.getModel(layer) : layer.data,
        registry: coreRegistries.layers,
      };
      const view = resolveLayerPreview(
        def
          ? (def.renderPreview(previewCtx) as LayerPreviewDescriptor)
          : {
              kind: 'placeholder',
              text: `Unknown: ${layer.type}`,
            },
        commandCtx
      );
      const childLayers = getLayerChildren(layer);
      const children =
        childLayers.length > 0
          ? childLayers.map((child) => buildSurfaceItem(child))
          : undefined;
      return { layer, view, children };
    };

    const layerSurface = activePage.layers.map((layer) =>
      buildSurfaceItem(layer)
    );

    return {
      editor,
      editorPaneKind: resolveEditorPaneKind(scene),
      editorPanes: ctx.providerRegistries.editorPaneRegistry
        .entries()
        .map(([editorPaneKind, Component]) => ({
          Component,
          editorPaneKind,
        })),
      layerSurface,
    };
  }
}
