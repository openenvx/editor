import type { DocumentNode } from './types';

export interface LegacyTestLayerInput {
  id: string;
  type: string;
  data?: Record<string, unknown> | null;
  props?: Record<string, unknown>;
}

/** Build a document node from legacy test literals (`data.children`, nested `data`, slots). */
export function legacyTestLayer(input: LegacyTestLayerInput): DocumentNode {
  const raw = structuredClone(input.props ?? input.data ?? {}) as Record<
    string,
    unknown
  >;
  let children: DocumentNode[] | undefined;
  if (Array.isArray(raw.children)) {
    children = (raw.children as LegacyTestLayerInput[]).map((child) =>
      legacyTestLayer(child)
    );
    delete raw.children;
  }
  if (raw.slots && typeof raw.slots === 'object') {
    const slots = raw.slots as Record<string, unknown>;
    const nextSlots: Record<string, DocumentNode[]> = {};
    for (const [key, parts] of Object.entries(slots)) {
      if (Array.isArray(parts)) {
        nextSlots[key] = parts.map((part) =>
          legacyTestLayer(part as LegacyTestLayerInput)
        );
      }
    }
    raw.slots = nextSlots;
  }
  const node: DocumentNode = {
    id: input.id,
    type: input.type,
    props: raw,
  };
  if (children?.length) {
    node.children = children;
  }
  return node;
}
