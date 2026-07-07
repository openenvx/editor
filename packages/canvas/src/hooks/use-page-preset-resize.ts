import { useWorkbenchContext } from '@openenvx/headless/react';

export function usePagePresetResize() {
  const { executeCommand } = useWorkbenchContext();

  return (presetId: string) =>
    executeCommand('canvas.resizePagePreset', { presetId });
}
