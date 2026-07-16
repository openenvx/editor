export type UserGuideOrientation = 'horizontal' | 'vertical';

export interface UserGuide {
  id: string;
  orientation: UserGuideOrientation;
  /** Position in artboard pixels (x for vertical, y for horizontal). */
  position: number;
}

export interface CanvasRulerGuidesSettingsSnapshot {
  guidesByPageId: Readonly<Record<string, readonly UserGuide[]>>;
  showRulers: boolean;
}

export type CanvasRulerGuidesSettingsListener = (
  snapshot: CanvasRulerGuidesSettingsSnapshot
) => void;

const EMPTY_GUIDES: readonly UserGuide[] = [];

export class CanvasRulerGuidesSettings {
  private showRulers = true;
  private guidesByPageId: Record<string, UserGuide[]> = {};
  private readonly listeners = new Set<CanvasRulerGuidesSettingsListener>();

  getSnapshot(): CanvasRulerGuidesSettingsSnapshot {
    return {
      guidesByPageId: this.guidesByPageId,
      showRulers: this.showRulers,
    };
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

  getGuidesForPage(pageId: string): readonly UserGuide[] {
    return this.guidesByPageId[pageId] ?? EMPTY_GUIDES;
  }

  addGuide(
    pageId: string,
    guide: Omit<UserGuide, 'id'> & { id?: string }
  ): UserGuide {
    const next: UserGuide = {
      id: guide.id ?? crypto.randomUUID(),
      orientation: guide.orientation,
      position: guide.position,
    };
    const existing = this.guidesByPageId[pageId] ?? [];
    this.guidesByPageId = {
      ...this.guidesByPageId,
      [pageId]: [...existing, next],
    };
    this.notify();
    return next;
  }

  moveGuide(pageId: string, guideId: string, position: number): void {
    const existing = this.guidesByPageId[pageId];
    if (!existing) {
      return;
    }
    let changed = false;
    const next = existing.map((guide) => {
      if (guide.id !== guideId || guide.position === position) {
        return guide;
      }
      changed = true;
      return { ...guide, position };
    });
    if (!changed) {
      return;
    }
    this.guidesByPageId = { ...this.guidesByPageId, [pageId]: next };
    this.notify();
  }

  removeGuide(pageId: string, guideId: string): void {
    const existing = this.guidesByPageId[pageId];
    if (!existing) {
      return;
    }
    const next = existing.filter((guide) => guide.id !== guideId);
    if (next.length === existing.length) {
      return;
    }
    if (next.length === 0) {
      const { [pageId]: _, ...rest } = this.guidesByPageId;
      this.guidesByPageId = rest;
    } else {
      this.guidesByPageId = { ...this.guidesByPageId, [pageId]: next };
    }
    this.notify();
  }

  clearPageGuides(pageId: string): void {
    if (!this.guidesByPageId[pageId]) {
      return;
    }
    const { [pageId]: _, ...rest } = this.guidesByPageId;
    this.guidesByPageId = rest;
    this.notify();
  }

  /** Drop guide entries for pages that no longer exist. */
  pruneToPageIds(pageIds: readonly string[]): void {
    const keep = new Set(pageIds);
    let changed = false;
    const next: Record<string, UserGuide[]> = {};
    for (const [pageId, guides] of Object.entries(this.guidesByPageId)) {
      if (keep.has(pageId)) {
        next[pageId] = guides;
      } else {
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    this.guidesByPageId = next;
    this.notify();
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
