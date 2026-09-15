export interface KindRegistryRegisterOptions {
  override?: boolean;
}

export class KindRegistry<T extends { kind: string }> {
  private readonly entries = new Map<string, T>();

  constructor(private readonly label: string) {}

  register(entry: T, options?: KindRegistryRegisterOptions): void {
    if (this.entries.has(entry.kind) && !options?.override) {
      throw new Error(`${this.label} already registered: ${entry.kind}`);
    }
    this.entries.set(entry.kind, entry);
  }

  get(kind: string): T | undefined {
    return this.entries.get(kind);
  }

  getAll(): T[] {
    return [...this.entries.values()];
  }
}
