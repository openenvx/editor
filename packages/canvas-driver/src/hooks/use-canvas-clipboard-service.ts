import { useCanvasHost } from '../canvas-host-context';
import { CanvasClipboardServiceId } from '../canvas-service-tokens';
import type { CanvasClipboardService } from '../clipboard/canvas-clipboard-service';

export function useCanvasClipboardService(): CanvasClipboardService {
  const host = useCanvasHost();
  return host.getService(CanvasClipboardServiceId)!;
}
