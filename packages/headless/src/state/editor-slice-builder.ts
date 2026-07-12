import { getActivePage, resolveEditorPaneKind } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import { resolveLayerPreview } from '../utils/layer-preview-resolver';
import type { EditorSlice } from '../workbench-state-cache';
import type { WorkbenchSliceContext } from './workbench-slice-context';

export class EditorSliceBuilder {
  build(ctx: WorkbenchSliceContext): EditorSlice {
    const coreRegistries = ctx.manager.getRegistries();
    const workbenchRegistries = ctx.workbenchRegistries;
    const commandCtx = ctx.manager.createCommandContext();
    const scene = ctx.sceneStore.getScene();
    const editor = ctx.editorService.getActiveEditor();
    const activePage = getActivePage(scene);
    const selectedIds = new Set(scene.selection.selectedLayerIds);

    const layerSurface = activePage.layers.map((layer) => {
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
      return { layer, view };
    });

    return {
      editor,
      editorPaneKind: resolveEditorPaneKind(scene),
      editorPanes: workbenchRegistries.editorPanes.map((pane) => ({
        Component: pane.Component,
        editorPaneKind: pane.editorPaneKind,
      })),
      layerSurface,
    };
  }
}
