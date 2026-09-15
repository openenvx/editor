export const DEFAULT_CANVAS_GRID_SIZE = 8;

export interface CanvasGridSettingsSnapshot {
  enabled: boolean;
  size: number;
}

export type CanvasGridSettingsListener = (
  snapshot: CanvasGridSettingsSnapshot
) => void;

export class CanvasGridSettings {
  private enabled = false;
  private size = DEFAULT_CANVAS_GRID_SIZE;
  private readonly listeners = new Set<CanvasGridSettingsListener>();

  getSnapshot(): CanvasGridSettingsSnapshot {
    return { enabled: this.enabled, size: this.size };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getSize(): number {
    return this.size;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }
    this.enabled = enabled;
    this.notify();
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  setSize(size: number): void {
    const next = Math.max(1, Math.round(size));
    if (this.size === next) {
      return;
    }
    this.size = next;
    this.notify();
  }

  subscribe(listener: CanvasGridSettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
