import { evaluateContextKeyWhenExpression } from '../evaluate-when-expression';
import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';

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

  dispose(): void {
    this.onDidChangeEmitter.dispose();
    this.keys.clear();
  }
}

export function createContextKeyService(): ContextKeyService {
  return new ContextKeyService();
}
