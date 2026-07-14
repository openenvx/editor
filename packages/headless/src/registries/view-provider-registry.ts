import type { TreeDataProvider } from '../contributions/view-contribution';

/** Registration options — Spring-style `@Primary` / `@Order` (lower order = higher priority). */
export interface ViewProviderRegisterOptions {
  /** Wins over non-primary providers for the same view id. */
  primary?: boolean;
  /** Tie-breaker when multiple providers match; lower value wins. Default: 0. */
  order?: number;
}

export interface ViewProviderRegistry {
  registerTreeDataProvider(
    viewId: string,
    provider: TreeDataProvider<unknown>,
    options?: ViewProviderRegisterOptions
  ): void;
  get(viewId: string): TreeDataProvider<unknown> | undefined;
}

interface ViewProviderEntry {
  provider: TreeDataProvider<unknown>;
  order: number;
  primary: boolean;
}

export class ViewProviderRegistryImpl implements ViewProviderRegistry {
  private readonly providers = new Map<string, ViewProviderEntry[]>();

  registerTreeDataProvider(
    viewId: string,
    provider: TreeDataProvider<unknown>,
    options?: ViewProviderRegisterOptions
  ): void {
    const entry: ViewProviderEntry = {
      order: options?.order ?? 0,
      primary: options?.primary ?? false,
      provider,
    };
    const existing = this.providers.get(viewId);
    if (existing) {
      existing.push(entry);
      return;
    }
    this.providers.set(viewId, [entry]);
  }

  get(viewId: string): TreeDataProvider<unknown> | undefined {
    const entries = this.providers.get(viewId);
    if (!entries || entries.length === 0) {
      return undefined;
    }
    if (entries.length === 1) {
      return entries[0]!.provider;
    }
    return resolveViewProvider(entries).provider;
  }
}

function resolveViewProvider(entries: ViewProviderEntry[]): ViewProviderEntry {
  const primaries = entries.filter((entry) => entry.primary);
  const pool = primaries.length > 0 ? primaries : entries;
  const sorted = [...pool].toSorted((a, b) => a.order - b.order);
  const bestOrder = sorted[0]!.order;
  const tied = sorted.filter((entry) => entry.order === bestOrder);
  if (tied.length > 1 && primaries.length > 0) {
    throw new Error(
      `Multiple primary TreeDataProvider registrations with order ${bestOrder} for one view`
    );
  }
  return tied[0]!;
}
