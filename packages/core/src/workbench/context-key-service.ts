import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
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
    if (!expression?.trim()) {
      return true;
    }
    return evaluateExpression(expression.trim(), this.keys);
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

    set('scene.layerSelected', selectedLayerIds.length > 0);
    set('scene.multiSelect', selectedLayerIds.length > 1);
    set('scene.multiPage', input.scene.pages.length > 1);
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

function evaluateExpression(
  expr: string,
  keys: Map<string, boolean | string | number>
): boolean {
  if (expr.includes('||')) {
    return expr
      .split('||')
      .some((part) => evaluateExpression(part.trim(), keys));
  }
  if (expr.includes('&&')) {
    return expr
      .split('&&')
      .every((part) => evaluateExpression(part.trim(), keys));
  }
  if (expr.startsWith('!')) {
    return !evaluateExpression(expr.slice(1).trim(), keys);
  }
  const eqMatch = expr.match(/^(.+?)\s*==\s*(.+)$/);
  if (eqMatch) {
    const left = resolveValue(eqMatch[1]!.trim(), keys);
    const right = resolveValue(eqMatch[2]!.trim(), keys);
    return left === right;
  }
  const value = resolveValue(expr, keys);
  return Boolean(value);
}

function resolveValue(
  token: string,
  keys: Map<string, boolean | string | number>
): boolean | string | number {
  if (
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('"') && token.endsWith('"'))
  ) {
    return token.slice(1, -1);
  }
  if (token === 'true') {
    return true;
  }
  if (token === 'false') {
    return false;
  }
  const keyValue = keys.get(token);
  if (keyValue !== undefined) {
    return keyValue;
  }
  return false;
}

export function createContextKeyService(): ContextKeyService {
  return new ContextKeyService();
}
