import { useWorkbenchContext } from '@openenvx/headless/react';
import { useMemo } from 'react';

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
  const { api } = useWorkbenchContext();

  return useMemo(() => {
    const reader = api.getService<CanvasRegistriesReader>(
      CanvasRegistriesServiceId
    );
    return reader?.getSnapshot() ?? EMPTY_SNAPSHOT;
  }, [api]);
}
