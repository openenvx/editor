import type { BlockConfig } from '@openenvx/html';

import { headerBlock } from './pattern-blocks';

export interface EmailPatternEntry {
  block: BlockConfig;
  /** Filter chip / section group. */
  group: string;
  description: string;
  tags: string[];
}

/** Catalog for the Blocks gallery sheet (search / filter / insert). */
export const emailPatternCatalog: EmailPatternEntry[] = [
  {
    block: headerBlock,
    group: 'Headers',
    description: 'Centered logo with horizontal navigation links.',
    tags: ['header', 'logo', 'nav', 'navigation'],
  },
];

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
      ...entry.tags,
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
