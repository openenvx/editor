import { evaluateContextKeyWhenExpression } from '../evaluate-when-expression';
import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import { findLayerById } from '../scene/layer-tree';
import type { Scene, Selection } from '../scene/types';

export class ContextKeyService {
  private readonly keys = new Map<string, boolean | string | number>();
  private readonly onDidChangeEmitter = new Emitter<void>();

  readonly onDidChangeContext: Event<void> = this.onDidChangeEmitter.event;

  setContext(key: string, value: boolean | string | number): boolean {
    const previous = this.keys.get(key);
    if (previous === value) {
      return false;
    }
    this.keys.set(key, value);
    this.onDidChangeEmitter.fire();
    return true;
  }

  set(key: string, value: boolean | string | number): boolean {
    return this.setContext(key, value);
  }

  get(key: string): boolean | string | number | undefined {
    return this.keys.get(key);
  }

  evaluate(expression: string | undefined): boolean {
    return evaluateContextKeyWhenExpression(expression, this.keys);
  }

  snapshot(): Record<string, boolean | string | number> {
    return Object.fromEntries(this.keys);
  }

  syncSceneKeys(input: {
    scene: Scene;
    selection: Selection;
    isDirty: boolean;
    hasActiveEditor: boolean;
    customKeys?: Record<string, boolean | string | number>;
  }): boolean {
    const page =
      input.scene.pages.find(
        (entry) => entry.id === input.selection.activePageId
      ) ?? input.scene.pages[0]!;
    const { selectedLayerIds } = input.selection;

    let changed = false;
    const set = (key: string, value: boolean | string | number) => {
      if (this.setContext(key, value)) {
        changed = true;
      }
    };

    const primaryLayerId =
      input.selection.primaryLayerId ?? selectedLayerIds[0] ?? null;
    const primaryLayer = primaryLayerId
      ? findLayerById(input.scene, primaryLayerId)
      : null;

    set('scene.layerSelected', selectedLayerIds.length > 0);
    set('scene.multiSelect', selectedLayerIds.length > 1);
    set('scene.multiPage', input.scene.pages.length > 1);
    set('scene.primaryLayerType', primaryLayer?.type ?? '');
    set('page.layout', page.layout);
    set('page.layoutAbsolute', page.layout === 'absolute');
    set('page.layoutFlow', page.layout === 'flow');
    set('editor.dirty', input.isDirty);
    set('editor.hasActiveEditor', input.hasActiveEditor);

    if (input.customKeys) {
      for (const [key, value] of Object.entries(input.customKeys)) {
        set(key, value);
      }
    }

    return changed;
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
    this.keys.clear();
  }
}

export function createContextKeyService(): ContextKeyService {
  return new ContextKeyService();
}
