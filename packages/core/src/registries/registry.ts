export type RegistryDuplicatePolicy = 'throw' | 'overwrite' | 'ignore';

export class Registry<K extends string, V> {
  private readonly items = new Map<K, V>();

  constructor(
    private readonly duplicatePolicy: RegistryDuplicatePolicy = 'overwrite'
  ) {}

  register(key: K, value: V): void {
    if (this.items.has(key)) {
      if (this.duplicatePolicy === 'throw') {
        throw new Error(`Duplicate registry entry: ${key}`);
      }
      if (this.duplicatePolicy === 'ignore') {
        return;
      }
    }
    this.items.set(key, value);
  }

  get(key: K): V | undefined {
    return this.items.get(key);
  }

  has(key: K): boolean {
    return this.items.has(key);
  }

  entries(): readonly [K, V][] {
    return [...this.items.entries()];
  }

  getAll(): readonly V[] {
    return [...this.items.values()];
  }

  keys(): readonly K[] {
    return [...this.items.keys()];
  }
}
