import { useCanvasHost } from '../canvas-host-context';

export function usePagePresetResize() {
  const host = useCanvasHost();

  return (presetId: string) =>
    host.executeCommand('canvas.resizePagePreset', { presetId });
}
