import type { Transform } from '@xmazu/openenvxee-schema';
import { useCallback } from 'react';

import { useCanvasHost } from '../canvas-host-context';

export function useCanvasApi() {
  const host = useCanvasHost();

  const setPageSize = useCallback(
    async (width: number, height: number) =>
      host.executeCommand('canvas.setPageSize', { height, width }),
    [host]
  );

  const setPagePreset = useCallback(
    async (presetId: string) =>
      host.executeCommand('canvas.setPagePreset', { presetId }),
    [host]
  );

  const resizePagePreset = useCallback(
    async (presetId: string) =>
      host.executeCommand('canvas.resizePagePreset', { presetId }),
    [host]
  );

  const updateLayerTransform = useCallback(
    async (
      layerId: string,
      transform: Transform,
      options?: { dataPatch?: Record<string, unknown> }
    ) =>
      host.executeCommand('canvas.updateLayerTransform', {
        dataPatch: options?.dataPatch,
        layerId,
        transform,
      }),
    [host]
  );

  const updateRichTextTransform = useCallback(
    async (
      layerId: string,
      change: { fontSize: number; transform: Transform }
    ) =>
      host.executeCommand('canvas.updateRichTextTransform', {
        fontSize: change.fontSize,
        layerId,
        transform: change.transform,
      }),
    [host]
  );

  const exportImage = useCallback(async () => {
    const { executed, result } = await host.runCommand<{
      mimeType: string;
      dataUrl: string;
    }>('canvas.exportImage');
    if (!executed) {
      return null;
    }
    return result ?? null;
  }, [host]);

  return {
    exportImage,
    resizePagePreset,
    setPagePreset,
    setPageSize,
    updateLayerTransform,
    updateRichTextTransform,
  };
}
