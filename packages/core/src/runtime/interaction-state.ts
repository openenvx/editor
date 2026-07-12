export interface InteractionState {
  hoveredLayerId: string | null;
}

export function createDefaultInteractionState(): InteractionState {
  return { hoveredLayerId: null };
}
