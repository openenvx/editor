import {
  getActiveArtboard,
  type Document,
  type EditorSession,
} from '@openenvx/editor';
import { artboardSpaceSize } from '@openenvx/editor/schema';
import {
  ContextKeyServiceId,
  type EditorPaneHostProps,
} from '@openenvx/studio';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/studio/react';
import { memo, useCallback, useMemo } from 'react';

import { CanvasHostProvider } from '../canvas-host-context';
import type { CanvasHostApi } from '../canvas-host-context';
import type { CanvasSelectLayerOptions } from '../canvas-stage-types';
import { resolveTextBoxFitPropertyUpdate } from '../fit-text-layer-to-content';
import { useCanvasApi } from '../hooks/use-canvas-api';
import { useCanvasRegistries } from '../hooks/use-canvas-registries';
import { useCanvasStageInteraction } from '../hooks/use-canvas-stage-interaction';
import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import {
  selectNodesViaApi,
  updatePropertyViaApi,
} from '../workbench-document-api';
import { CanvasEditor, type CanvasEditorProps } from './canvas-editor';

export const AbsoluteEditorPane = memo(
  ({
    onZoomChange,
    onContainerResize,
    onViewportApiReady,
  }: EditorPaneHostProps) => {
    const { api, executeCommand } = useWorkbenchContext();
    const scene = useWorkbenchContextSelector((state) => state.scene) as
      | Document
      | undefined;
    const selection = useWorkbenchContextSelector(
      (state) => state.selection
    ) as EditorSession | undefined;
    const layerSurface = useWorkbenchContextSelector(
      (state) => state.layerSurface
    );
    const hoveredLayerId = useWorkbenchContextSelector(
      (state) => state.interaction.hoveredLayerId
    );

    const canvasHost = useMemo<CanvasHostApi>(
      () => ({
        executeCommand,
        getService: (token) => api.getService(token),
        runCommand: (commandId, args) => api.runCommand(commandId, args),
        selectNodes: (layerIds, primaryNodeId) =>
          selectNodesViaApi(api, layerIds, primaryNodeId),
        setContextKey: (key, value) =>
          api.getService(ContextKeyServiceId)?.setContext(key, value),
        updateProperty: (layerId, key, value) =>
          updatePropertyViaApi(api, layerId, key, value),
      }),
      [api, executeCommand]
    );

    if (!scene || !selection || !layerSurface) {
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
    scene: Document;
    selection: EditorSession;
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
    const page = getActiveArtboard(scene);
    const { width: artboardWidth, height: artboardHeight } =
      artboardSpaceSize(page);

    const handleTransformChange = useCallback<
      CanvasEditorProps['onTransformChange']
    >(
      (layerId, change) => {
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
        void canvasApi.updateLayerTransform(layerId, change.transform, {
          dataPatch: change.dataPatch,
        });
      },
      [canvasApi]
    );

    const handleHoverLayer = useCallback(
      (layerId: string | null) => {
        api.setHoveredLayer(layerId);
      },
      [api]
    );

    const handlePropertyChange = useCallback(
      (layerId: string, key: string, value: unknown) => {
        const fit = resolveTextBoxFitPropertyUpdate(scene, layerId, key, value);
        if (!fit) {
          updatePropertyViaApi(api, layerId, key, value);
          return;
        }
        void canvasApi.updateLayerTransform(layerId, fit.transform, {
          dataPatch: fit.dataPatch,
        });
      },
      [api, canvasApi, scene]
    );

    const handleSelectLayer = useCallback(
      (layerId: string, options?: CanvasSelectLayerOptions) => {
        if (!layerId) {
          selectNodesViaApi(api, [], null);
          return;
        }
        if (options?.setPrimary) {
          selectNodesViaApi(api, selection.selectedNodeIds, layerId);
          return;
        }
        if (options?.additive) {
          const current = selection.selectedNodeIds;
          if (current.includes(layerId)) {
            const next = current.filter((id) => id !== layerId);
            selectNodesViaApi(api, next, next[0] ?? null);
            return;
          }
          selectNodesViaApi(
            api,
            [...current, layerId],
            selection.primaryNodeId ?? layerId
          );
          return;
        }
        selectNodesViaApi(api, [layerId], layerId);
      },
      [api, selection.primaryNodeId, selection.selectedNodeIds]
    );

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
        onHoverLayer={handleHoverLayer}
        onPropertyChange={handlePropertyChange}
        onSelectLayer={handleSelectLayer}
        onTransformChange={handleTransformChange}
        onViewportApiReady={onViewportApiReady}
        onZoomChange={onZoomChange}
        page={page}
        primaryNodeId={selection.primaryNodeId}
        scene={scene}
        selectedNodeIds={selection.selectedNodeIds}
        stageInteraction={stageInteraction}
      />
    );
  }
);
