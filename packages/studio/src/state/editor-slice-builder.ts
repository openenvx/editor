import { getNodeChildrenForDocument, resolveEditorPaneKind } from '../backbone';
import type { DocumentNode } from '../backbone';
import type { LayerPreviewDescriptor } from '../preview';
import { nodeProps } from '../schema/node-helpers';
import { resolveLayerPreview } from '../utils/layer-preview-resolver';
import type { EditorSlice } from '../workbench/workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

interface LayerSurfaceItem {
  layer: DocumentNode;
  view: LayerPreviewDescriptor;
  children?: LayerSurfaceItem[];
}

export class EditorSliceBuilder {
  build(ctx: WorkbenchSliceContext): EditorSlice {
    const coreRegistries = ctx.coreRegistries;
    const commandCtx = ctx.runtime.createCommandContext();
    const store = ctx.runtime.getDocument();
    const scene = store.getDocument();
    const editor = ctx.runtime.getEditor().getActiveEditor();
    const activePage = store.getActiveArtboard();
    const selectedIds = new Set(store.getSession().selectedNodeIds);
    const activeArtboardId = store.getActiveArtboardId();

    const buildSurfaceItem = (layer: DocumentNode): LayerSurfaceItem => {
      const def = coreRegistries.layers.get(layer.type);
      const previewCtx = {
        isSelected: selectedIds.has(layer.id),
        layerId: layer.id,
        model: def ? def.getModel(layer) : nodeProps(layer),
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
      const childLayers = getNodeChildrenForDocument(layer, scene);
      const children =
        childLayers.length > 0
          ? childLayers.map((child) => buildSurfaceItem(child))
          : undefined;
      return { layer, view, children };
    };

    const layerSurface = activePage.nodes.map((layer) =>
      buildSurfaceItem(layer)
    );

    return {
      editor,
      editorPaneKind: resolveEditorPaneKind(scene, activeArtboardId),
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
