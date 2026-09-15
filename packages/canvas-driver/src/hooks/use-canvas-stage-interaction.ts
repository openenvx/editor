import { useCanvasHost } from '../canvas-host-context';
import { CanvasStageInteractionServiceId } from '../canvas-service-tokens';
import type { CanvasStageInteractionService } from '../stage/canvas-stage-interaction';

export function useCanvasStageInteraction(): CanvasStageInteractionService | null {
  const host = useCanvasHost();
  return host.getService(CanvasStageInteractionServiceId) ?? null;
}
