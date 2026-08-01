import type { SceneSnapshot } from '../scene/types';

const DEFAULT_HISTORY_DEPTH = 100;

/**
 * Undo/redo stack of scene snapshots.
 *
 * Entries hold **shared scene references** (structural sharing from path-copying
 * transactions), not deep clones. Memory scales with changed nodes × depth,
 * not full-document × depth. Do not mutate stored scenes.
 */
export class HistoryStack {
  private past: SceneSnapshot[] = [];
  private future: SceneSnapshot[] = [];

  constructor(private readonly maxDepth = DEFAULT_HISTORY_DEPTH) {}

  push(snapshot: SceneSnapshot): void {
    this.past.push(snapshot);
    if (this.past.length > this.maxDepth) {
      this.past.shift();
    }
    this.future = [];
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(current: SceneSnapshot): SceneSnapshot | null {
    const previous = this.past.pop();
    if (!previous) {
      return null;
    }
    this.future.push(current);
    return previous;
  }

  redo(current: SceneSnapshot): SceneSnapshot | null {
    const next = this.future.pop();
    if (!next) {
      return null;
    }
    this.past.push(current);
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
