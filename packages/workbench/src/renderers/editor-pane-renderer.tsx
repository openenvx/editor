import type {
  EditorPaneHostProps,
  EditorPaneRegistration,
  LayerSurfaceItem,
} from '@openenvx/headless';
import type { ComponentType } from 'react';
import { memo } from 'react';

import { useEditorViewportBridge } from '../context/editor-viewport-context';

export interface EditorPaneRendererProps {
  editorPanes: EditorPaneRegistration[];
  editorPaneKind: string;
  layerSurface: LayerSurfaceItem[];
  onZoomChange?: (zoomPercent: number) => void;
  onContainerResize?: (size: { width: number; height: number }) => void;
  onViewportApiReady?: EditorPaneHostProps['onViewportApiReady'];
}

export const EditorPaneRenderer = memo(
  ({
    editorPanes,
    editorPaneKind,
    layerSurface,
    onZoomChange: onZoomChangeProp,
    onContainerResize,
    onViewportApiReady: onViewportApiReadyProp,
  }: EditorPaneRendererProps) => {
    const bridge = useEditorViewportBridge();

    const registration = editorPanes.find(
      (pane) => pane.editorPaneKind === editorPaneKind
    );
    if (!registration) {
      return null;
    }

    const Component =
      registration.Component as ComponentType<EditorPaneHostProps>;

    const onViewportApiReady =
      onViewportApiReadyProp ?? bridge.onViewportApiReady;
    const onZoomChange = onZoomChangeProp ?? bridge.onZoomChange;

    return (
      <Component
        layerSurface={layerSurface}
        onContainerResize={onContainerResize}
        onViewportApiReady={onViewportApiReady}
        onZoomChange={onZoomChange}
      />
    );
  }
);
