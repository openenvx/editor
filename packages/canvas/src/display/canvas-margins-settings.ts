export interface CanvasMarginsSettingsSnapshot {
  showMargins: boolean;
}

export type CanvasMarginsSettingsListener = (
  snapshot: CanvasMarginsSettingsSnapshot
) => void;

/** Session-only page margin overlay visibility. */
export class CanvasMarginsSettings {
  private showMargins = false;
  private readonly listeners = new Set<CanvasMarginsSettingsListener>();

  getSnapshot(): CanvasMarginsSettingsSnapshot {
    return { showMargins: this.showMargins };
  }

  isShowMargins(): boolean {
    return this.showMargins;
  }

  setShowMargins(showMargins: boolean): void {
    if (this.showMargins === showMargins) {
      return;
    }
    this.showMargins = showMargins;
    this.notify();
  }

  toggle(): void {
    this.setShowMargins(!this.showMargins);
  }

  subscribe(listener: CanvasMarginsSettingsListener): () => void {
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
