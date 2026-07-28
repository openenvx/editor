export type UserGuideOrientation = 'horizontal' | 'vertical';

export interface UserGuide {
  id: string;
  orientation: UserGuideOrientation;
  /** Position in artboard pixels (x for vertical, y for horizontal). */
  position: number;
}

export interface CanvasRulerGuidesSettingsSnapshot {
  showRulers: boolean;
}

export type CanvasRulerGuidesSettingsListener = (
  snapshot: CanvasRulerGuidesSettingsSnapshot
) => void;

/** Session-only ruler visibility. Guides live on `Page.guides` in the scene. */
export class CanvasRulerGuidesSettings {
  private showRulers = true;
  private readonly listeners = new Set<CanvasRulerGuidesSettingsListener>();

  getSnapshot(): CanvasRulerGuidesSettingsSnapshot {
    return { showRulers: this.showRulers };
  }

  isShowRulers(): boolean {
    return this.showRulers;
  }

  setShowRulers(showRulers: boolean): void {
    if (this.showRulers === showRulers) {
      return;
    }
    this.showRulers = showRulers;
    this.notify();
  }

  toggleRulers(): void {
    this.setShowRulers(!this.showRulers);
  }

  subscribe(listener: CanvasRulerGuidesSettingsListener): () => void {
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
