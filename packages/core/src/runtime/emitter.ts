export interface Disposable {
  dispose(): void;
}

export type Event<T> = (
  listener: (event: T) => unknown,
  thisArgs?: unknown
) => Disposable;

export class Emitter<T> {
  private readonly listeners = new Set<(event: T) => unknown>();

  readonly event: Event<T> = (listener, thisArgs) => {
    const handler = thisArgs
      ? (event: T) => listener.call(thisArgs, event)
      : listener;
    this.listeners.add(handler);
    return {
      dispose: () => {
        this.listeners.delete(handler);
      },
    };
  };

  fire(event: T): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  dispose(): void {
    this.listeners.clear();
  }
}

export class DisposableStore implements Disposable {
  private readonly disposables: Disposable[] = [];

  add<T extends Disposable>(disposable: T): T {
    this.disposables.push(disposable);
    return disposable;
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
