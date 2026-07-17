import { IconRegistryId } from '@openenvx/core';
import type { LucideIcon } from 'lucide-react';
import { Layers } from 'lucide-react';
import type { ReactNode } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { LUCIDE_GLYPHS } from './lucide-glyphs';

export interface WorkbenchIconProps {
  id?: string;
  size?: number;
  className?: string;
  fallbackId?: string;
}

function resolveGlyph(
  registry: { resolve: (id: string) => unknown } | undefined,
  id: string
): LucideIcon | undefined {
  const fromRegistry = registry?.resolve(id) as LucideIcon | null | undefined;
  if (fromRegistry) {
    return fromRegistry;
  }
  return LUCIDE_GLYPHS[id];
}

export function WorkbenchIcon({
  id,
  size = 16,
  className,
  fallbackId = 'layers',
}: WorkbenchIconProps): ReactNode {
  const { api } = useWorkbenchContext();
  const registry = api.getService(IconRegistryId);
  const resolvedId = id ?? fallbackId;
  const Icon =
    resolveGlyph(registry, resolvedId) ??
    resolveGlyph(registry, fallbackId) ??
    LUCIDE_GLYPHS[fallbackId] ??
    Layers;
  return <Icon aria-hidden className={className} size={size} />;
}
