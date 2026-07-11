import { useWorkbenchContext } from '@openenvx/headless/react';

import { CanvasStageInteractionServiceId } from '../canvas-service-tokens';
import type { CanvasStageInteractionService } from '../stage/canvas-stage-interaction';

export function useCanvasStageInteraction(): CanvasStageInteractionService | null {
  const { api } = useWorkbenchContext();
  return api.getService(CanvasStageInteractionServiceId) ?? null;
}
