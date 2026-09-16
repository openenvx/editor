import { getLayerChildrenForScene, resolveEditorPaneKind } from '../backbone';
import type { Layer } from '../backbone';
import type { LayerPreviewDescriptor } from '../preview';
import { resolveLayerPreview } from '../utils/layer-preview-resolver';
import type { EditorSlice } from '../workbench/workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

interface LayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
  children?: LayerSurfaceItem[];
}

export class EditorSliceBuilder {
  build(ctx: WorkbenchSliceContext): EditorSlice {
    const coreRegistries = ctx.coreRegistries;
    const commandCtx = ctx.runtime.createCommandContext();
    const store = ctx.runtime.getScene();
    const scene = store.getScene();
    const editor = ctx.runtime.getEditor().getActiveEditor();
    const activePage = store.getActivePage();
    const selectedIds = new Set(store.getSelection().selectedLayerIds);
    const activePageId = store.getActivePageId();

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
      const childLayers = getLayerChildrenForScene(layer, scene);
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
      editorPaneKind: resolveEditorPaneKind(scene, activePageId),
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
