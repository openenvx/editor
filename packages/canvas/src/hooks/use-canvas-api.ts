import { useWorkbenchContext } from '@openenvx/headless/react';
import type { Transform } from '@openenvx/schema';
import { useCallback } from 'react';

export function useCanvasApi() {
  const { api, executeCommand } = useWorkbenchContext();

  const setPageSize = useCallback(
    async (width: number, height: number) =>
      executeCommand('canvas.setPageSize', { height, width }),
    [executeCommand]
  );

  const setPagePreset = useCallback(
    async (presetId: string) =>
      executeCommand('canvas.setPagePreset', { presetId }),
    [executeCommand]
  );

  const resizePagePreset = useCallback(
    async (presetId: string) =>
      executeCommand('canvas.resizePagePreset', { presetId }),
    [executeCommand]
  );

  const updateLayerTransform = useCallback(
    async (layerId: string, transform: Transform) =>
      executeCommand('canvas.updateLayerTransform', {
        layerId,
        transform,
      }),
    [executeCommand]
  );

  const updateRichTextTransform = useCallback(
    async (
      layerId: string,
      change: { fontSize: number; transform: Transform }
    ) =>
      executeCommand('canvas.updateRichTextTransform', {
        fontSize: change.fontSize,
        layerId,
        transform: change.transform,
      }),
    [executeCommand]
  );

  const exportImage = useCallback(async () => {
    const { executed, result } = await api.runCommand<{
      mimeType: string;
      dataUrl: string;
    }>('canvas.exportImage');
    if (!executed) {
      return null;
    }
    return result ?? null;
  }, [api]);

  return {
    exportImage,
    resizePagePreset,
    setPagePreset,
    setPageSize,
    updateLayerTransform,
    updateRichTextTransform,
  };
}
