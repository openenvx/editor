import type { Layer as SceneLayer } from '@openenvx/core';
import type { Transform } from '@openenvx/schema';
import { useCallback, useState } from 'react';

export function useLiveTransformOverrides() {
  const [liveTransformOverrides, setLiveTransformOverrides] = useState<
    Map<string, Transform>
  >(() => new Map());

  const setLiveTransformOverride = useCallback(
    (layerId: string, transform: Transform | null) => {
      setLiveTransformOverrides((current) => {
        const next = new Map(current);
        if (transform) {
          next.set(layerId, transform);
        } else {
          next.delete(layerId);
        }
        return next;
      });
    },
    []
  );

  const getLayerTransform = useCallback(
    (layerId: string, transform: NonNullable<SceneLayer['transform']>) =>
      liveTransformOverrides.get(layerId) ?? transform,
    [liveTransformOverrides]
  );

  return {
    getLayerTransform,
    liveTransformOverrides,
    setLiveTransformOverride,
    setLiveTransformOverrides,
  };
}
