export interface DescriptorItemBase {
  id: string;
  when?: string;
  priority?: number;
}

export abstract class DescriptorBuilder<TItem extends DescriptorItemBase> {
  protected readonly items: TItem[] = [];

  protected push(item: TItem): this {
    this.items.push(item);
    return this;
  }

  build(): TItem[] {
    return [...this.items];
  }
}

export interface ShellItemOptions {
  when?: string;
  priority?: number;
}

export function applyShellItemOptions<T extends DescriptorItemBase>(
  item: T,
  options?: ShellItemOptions
): T {
  if (options?.when !== undefined) {
    item.when = options.when;
  }
  if (options?.priority !== undefined) {
    item.priority = options.priority;
  }
  return item;
}
