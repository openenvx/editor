import type { BlockConfig } from '@openenvx/html';

/**
 * Gallery entry: block config + sheet metadata in one place.
 * Patterns are layout containers (`acceptsChildren`) whose `defaultData.children`
 * are Elements visible in Layers — not `data.slots`.
 */
export interface EmailPatternEntry {
  block: BlockConfig;
  /** Filter chip / section group. */
  group: string;
  description: string;
  tags?: string[];
  /** Extra block configs to register (e.g. `email.link`); not used for content storage. */
  parts?: BlockConfig[];
}

/** One call = Blocks gallery card + BlockRegistry registration. */
export function defineEmailPattern(
  entry: EmailPatternEntry
): EmailPatternEntry & { tags: string[] } {
  return {
    ...entry,
    tags: entry.tags ?? [],
    block: {
      ...entry.block,
      palette: false,
    },
  };
}

export function collectPatternRegistry(patterns: EmailPatternEntry[]): {
  catalog: EmailPatternEntry[];
  blocks: BlockConfig[];
  parts: BlockConfig[];
} {
  const partsByType = new Map<string, BlockConfig>();
  for (const pattern of patterns) {
    for (const part of pattern.parts ?? []) {
      partsByType.set(part.type, part);
    }
  }
  return {
    catalog: patterns,
    blocks: patterns.map((pattern) => pattern.block),
    parts: [...partsByType.values()],
  };
}

export function filterPatternCatalog(
  catalog: EmailPatternEntry[],
  query: string,
  group: string | null
): EmailPatternEntry[] {
  const q = query.trim().toLowerCase();
  return catalog.filter((entry) => {
    if (group && entry.group !== group) {
      return false;
    }
    if (!q) {
      return true;
    }
    const haystack = [
      entry.block.label,
      entry.description,
      entry.group,
      ...(entry.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function patternGroups(catalog: EmailPatternEntry[]): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const entry of catalog) {
    if (!seen.has(entry.group)) {
      seen.add(entry.group);
      groups.push(entry.group);
    }
  }
  return groups;
}
