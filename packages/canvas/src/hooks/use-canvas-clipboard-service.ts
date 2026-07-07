import { useWorkbenchContext } from '@openenvx/headless/react';

import { CanvasClipboardServiceId } from '../canvas-service-tokens';
import type { CanvasClipboardService } from '../clipboard/canvas-clipboard-service';

export function useCanvasClipboardService(): CanvasClipboardService {
  const { api } = useWorkbenchContext();
  return api.getService(CanvasClipboardServiceId)!;
}
