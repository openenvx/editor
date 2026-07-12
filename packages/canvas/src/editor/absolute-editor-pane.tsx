import {
  ContextKeyServiceId,
  getActivePage,
  type Scene,
  type Selection,
} from '@openenvx/core';
import type { EditorPaneHostProps } from '@openenvx/headless';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import { getDefaultPageDimensions } from '@openenvx/schema';
import { memo, useMemo } from 'react';

import { CanvasHostProvider } from '../canvas-host-context';
import type { CanvasHostApi } from '../canvas-host-context';
import { useCanvasApi } from '../hooks/use-canvas-api';
import { useCanvasRegistries } from '../hooks/use-canvas-registries';
import { useCanvasStageInteraction } from '../hooks/use-canvas-stage-interaction';
import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { CanvasEditor, type CanvasEditorProps } from './canvas-editor';

export const AbsoluteEditorPane = memo(
  ({
    layerSurface,
    onZoomChange,
    onContainerResize,
    onViewportApiReady,
  }: EditorPaneHostProps) => {
    const { api, executeCommand } = useWorkbenchContext();
    const scene = useWorkbenchContextSelector((state) => state.scene);
    const selection = useWorkbenchContextSelector((state) => state.selection);
    const hoveredLayerId = useWorkbenchContextSelector(
      (state) => state.interaction.hoveredLayerId
    );

    const canvasHost = useMemo<CanvasHostApi>(
      () => ({
        executeCommand,
        getService: (token) => api.getService(token),
        runCommand: (commandId, args) => api.runCommand(commandId, args),
        selectLayers: (layerIds, primaryLayerId) =>
          api.selectLayers(layerIds, primaryLayerId),
        setContextKey: (key, value) =>
          api.getService(ContextKeyServiceId)?.setContext(key, value),
        updateProperty: (layerId, key, value) =>
          api.updateProperty(layerId, key, value),
      }),
      [api, executeCommand]
    );

    if (!scene || !selection) {
      return null;
    }

    return (
      <CanvasHostProvider host={canvasHost}>
        <AbsoluteEditorPaneInner
          hoveredLayerId={hoveredLayerId}
          layerSurface={layerSurface as CanvasLayerSurfaceItem[]}
          onContainerResize={onContainerResize}
          onViewportApiReady={onViewportApiReady}
          onZoomChange={onZoomChange}
          scene={scene}
          selection={selection}
        />
      </CanvasHostProvider>
    );
  }
);

const AbsoluteEditorPaneInner = memo(
  ({
    layerSurface,
    scene,
    selection,
    hoveredLayerId,
    onZoomChange,
    onContainerResize,
    onViewportApiReady,
  }: {
    layerSurface: CanvasLayerSurfaceItem[];
    scene: Scene;
    selection: Selection;
    hoveredLayerId: string | null;
    onZoomChange?: (zoomPercent: number) => void;
    onContainerResize?: (size: { width: number; height: number }) => void;
    onViewportApiReady?: CanvasEditorProps['onViewportApiReady'];
  }) => {
    const { api, executeCommand } = useWorkbenchContext();
    const canvasApi = useCanvasApi();
    const { canvasLayerInteractions, canvasLayerRenderers } =
      useCanvasRegistries();
    const stageInteraction = useCanvasStageInteraction();
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
        hoveredLayerId={hoveredLayerId}
        layerSurface={layerSurface}
        onContainerResize={onContainerResize}
        onExecuteCommand={executeCommand}
        onHoverLayer={(layerId) => api.setHoveredLayer(layerId)}
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
        stageInteraction={stageInteraction}
      />
    );
  }
);
