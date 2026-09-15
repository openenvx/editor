import { useMemo } from 'react';

import { useCanvasHost } from '../canvas-host-context';
import { CanvasRegistriesServiceId } from '../canvas-service-tokens';
import type {
  CanvasRegistriesReader,
  CanvasRegistriesSnapshot,
} from '../registry/canvas-registries-reader';

const EMPTY_SNAPSHOT: CanvasRegistriesSnapshot = {
  canvasLayerInteractions: [],
  canvasLayerRenderers: [],
  layerPreviewRenderers: [],
};

export function useCanvasRegistries(): CanvasRegistriesSnapshot {
  const host = useCanvasHost();

  return useMemo(() => {
    const reader = host.getService<CanvasRegistriesReader>(
      CanvasRegistriesServiceId
    );
    return reader?.getSnapshot() ?? EMPTY_SNAPSHOT;
  }, [host]);
}
