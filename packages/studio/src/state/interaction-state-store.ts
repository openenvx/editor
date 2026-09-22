import {
  createDefaultInteractionState,
  Emitter,
  type Event,
  type InteractionState,
} from '../backbone';

export class InteractionStateStore {
  private state: InteractionState = createDefaultInteractionState();
  private readonly onDidChangeEmitter = new Emitter<InteractionState>();

  readonly onDidChange: Event<InteractionState> = this.onDidChangeEmitter.event;

  getState(): Readonly<InteractionState> {
    return this.state;
  }

  setHoveredLayer(layerId: string | null): void {
    if (this.state.hoveredLayerId === layerId) {
      return;
    }
    this.state = { hoveredLayerId: layerId };
    this.onDidChangeEmitter.fire(this.state);
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }
}
