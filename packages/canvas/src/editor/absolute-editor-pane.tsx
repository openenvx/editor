import type { EditorPaneHostProps } from '@openenvx/core';
import { getActivePage } from '@openenvx/core';
import type { LayerSurfaceItem } from '@openenvx/headless';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import { getDefaultPageDimensions } from '@openenvx/schema';
import { memo } from 'react';

import { useCanvasApi } from '../hooks/use-canvas-api';
import { useCanvasRegistries } from '../hooks/use-canvas-registries';
import { useCanvasStageInteraction } from '../hooks/use-canvas-stage-interaction';
import { CanvasEditor } from './canvas-editor';
import type { CanvasEditorProps } from './canvas-editor';

export const AbsoluteEditorPane = memo(
  ({
    layerSurface: layerSurfaceProp,
    onZoomChange,
    onContainerResize,
    onViewportApiReady,
  }: EditorPaneHostProps) => {
    const { api, executeCommand } = useWorkbenchContext();
    const scene = useWorkbenchContextSelector((state) => state.scene);
    const selection = useWorkbenchContextSelector((state) => state.selection);
    const canvasApi = useCanvasApi();
    const { canvasLayerInteractions, canvasLayerRenderers } =
      useCanvasRegistries();
    const stageInteraction = useCanvasStageInteraction();
    const layerSurface = layerSurfaceProp as LayerSurfaceItem[];
    if (!scene || !selection) {
      return null;
    }
    const page = getActivePage(scene);
    const defaultDimensions = getDefaultPageDimensions();
    const artboardWidth = page.width ?? defaultDimensions.width;
    const artboardHeight = page.height ?? defaultDimensions.height;

    const handleTransformChange: CanvasEditorProps['onTransformChange'] = (
      layerId,
      change
    ) => {
      if (!change.transform) {
        return;
      }
      if (change.fontSize !== undefined) {
        void canvasApi.updateRichTextTransform(layerId, {
          fontSize: change.fontSize,
          transform: change.transform,
        });
        return;
      }
      void canvasApi.updateLayerTransform(layerId, change.transform);
    };

    return (
      <CanvasEditor
        artboardHeight={artboardHeight}
        artboardWidth={artboardWidth}
        canvasLayerInteractions={canvasLayerInteractions}
        canvasLayerRenderers={canvasLayerRenderers}
        stageInteraction={stageInteraction}
        layerSurface={layerSurface}
        onContainerResize={onContainerResize}
        onExecuteCommand={executeCommand}
        onPropertyChange={(layerId, key, value) => {
          api.updateProperty(layerId, key, value);
        }}
        onSelectLayer={(layerId, options) => {
          if (!layerId) {
            api.selectLayers([], null);
            return;
          }
          if (options?.additive) {
            const current = selection.selectedLayerIds;
            if (current.includes(layerId)) {
              const next = current.filter((id) => id !== layerId);
              api.selectLayers(next, next[0] ?? null);
              return;
            }
            api.selectLayers(
              [...current, layerId],
              selection.primaryLayerId ?? layerId
            );
            return;
          }
          api.selectLayers([layerId], layerId);
        }}
        onTransformChange={handleTransformChange}
        onViewportApiReady={onViewportApiReady}
        onZoomChange={onZoomChange}
        page={page}
        selectedLayerIds={selection.selectedLayerIds}
      />
    );
  }
);
