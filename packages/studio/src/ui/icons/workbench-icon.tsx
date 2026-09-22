import type { Icon } from '@tabler/icons-react';
import { IconLayersLinked } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { IconRegistryId } from '#studio';

import { useWorkbenchContext } from '../../context/workbench-context';
import { TABLER_GLYPHS } from './tabler-glyphs';

export interface WorkbenchIconProps {
  id?: string;
  size?: number;
  className?: string;
  fallbackId?: string;
}

function resolveGlyph(
  registry: { resolve: (id: string) => unknown } | undefined,
  id: string
): Icon | undefined {
  const fromRegistry = registry?.resolve(id) as Icon | null | undefined;
  if (fromRegistry) {
    return fromRegistry;
  }
  return TABLER_GLYPHS[id];
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
  const IconComponent =
    resolveGlyph(registry, resolvedId) ??
    resolveGlyph(registry, fallbackId) ??
    TABLER_GLYPHS[fallbackId] ??
    IconLayersLinked;
  return (
    <IconComponent aria-hidden className={className} size={size} stroke={1.5} />
  );
}
