import type { EditorViewportApi } from '@openenvx/core';
import { EditorViewportServiceId } from '@openenvx/core';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { useWorkbenchContext } from './workbench-context';

export interface EditorViewportContextValue {
  zoomPercent: number;
  onViewportApiReady: (api: EditorViewportApi | null) => void;
  onZoomChange: (zoomPercent: number) => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo100: () => void;
  zoomToFit: () => void;
}

const EditorViewportContext = createContext<EditorViewportContextValue | null>(
  null
);

export function EditorViewportProvider({ children }: { children: ReactNode }) {
  const { api } = useWorkbenchContext();
  const [zoomPercent, setZoomPercent] = useState(100);
  const [viewportApi, setViewportApi] = useState<EditorViewportApi | null>(
    null
  );

  const onViewportApiReady = useCallback(
    (instance: EditorViewportApi | null) => {
      setViewportApi(instance);
      const viewportService = api.getService(EditorViewportServiceId);
      if (!viewportService) {
        return;
      }
      viewportService.setViewport(instance);
      if (instance) {
        const percent = instance.getZoomPercent();
        setZoomPercent(percent);
        viewportService.setZoomPercent(percent);
      }
    },
    [api]
  );

  const onZoomChange = useCallback(
    (percent: number) => {
      setZoomPercent(percent);
      api.getService(EditorViewportServiceId)?.setZoomPercent(percent);
    },
    [api]
  );

  const syncZoomFromViewport = useCallback(() => {
    if (!viewportApi) {
      return;
    }
    const percent = viewportApi.getZoomPercent();
    setZoomPercent(percent);
    api.getService(EditorViewportServiceId)?.setZoomPercent(percent);
  }, [api, viewportApi]);

  const value = useMemo(
    (): EditorViewportContextValue => ({
      onViewportApiReady,
      onZoomChange,
      resetZoom: () => {
        viewportApi?.reset();
        syncZoomFromViewport();
      },
      zoomIn: () => {
        viewportApi?.zoomIn();
        syncZoomFromViewport();
      },
      zoomOut: () => {
        viewportApi?.zoomOut();
        syncZoomFromViewport();
      },
      zoomPercent,
      zoomTo100: () => {
        viewportApi?.zoomTo100();
        syncZoomFromViewport();
      },
      zoomToFit: () => {
        viewportApi?.zoomToFit();
        syncZoomFromViewport();
      },
    }),
    [
      onViewportApiReady,
      onZoomChange,
      syncZoomFromViewport,
      viewportApi,
      zoomPercent,
    ]
  );

  return (
    <EditorViewportContext.Provider value={value}>
      {children}
    </EditorViewportContext.Provider>
  );
}

export function useEditorViewport(): EditorViewportContextValue {
  const ctx = useContext(EditorViewportContext);
  if (!ctx) {
    throw new Error(
      'useEditorViewport must be used within EditorViewportProvider'
    );
  }
  return ctx;
}

export function useEditorViewportBridge(): Pick<
  EditorViewportContextValue,
  'onViewportApiReady' | 'onZoomChange'
> {
  const { onViewportApiReady, onZoomChange } = useEditorViewport();
  return { onViewportApiReady, onZoomChange };
}
