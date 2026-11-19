import type { LiveProjectSnapshot } from './types';

const DEFAULT_HISTORY_DEPTH = 100;

export class HistoryStack {
  private past: LiveProjectSnapshot[] = [];
  private future: LiveProjectSnapshot[] = [];

  constructor(private readonly maxDepth = DEFAULT_HISTORY_DEPTH) {}

  push(snapshot: LiveProjectSnapshot): void {
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

  undo(current: LiveProjectSnapshot): LiveProjectSnapshot | null {
    const previous = this.past.pop();
    if (!previous) {
      return null;
    }
    this.future.push(current);
    return previous;
  }

  redo(current: LiveProjectSnapshot): LiveProjectSnapshot | null {
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
