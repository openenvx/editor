/**
 * Map in-package `#studio` imports to published `@openenvx/studio` specifiers
 * for the shell publish bundle (headless stays in `dist/index.js`).
 */
const PUBLISHED_BY_INTERNAL: Record<string, string> = {
  '#studio': '@openenvx/studio',
  '#studio/schema': '@openenvx/studio/schema',
  '#studio/preview': '@openenvx/studio/preview',
  '#studio/react': '@openenvx/studio/react',
  '#studio/shell': '@openenvx/studio/shell',
  '#studio/internal': '@openenvx/studio/internal',
};

export function resolveStudioInternalAsPublished(
  source: string
): { id: string; external: true } | null {
  const exact = PUBLISHED_BY_INTERNAL[source];
  if (exact) {
    return { id: exact, external: true };
  }
  if (source.startsWith('#studio/')) {
    return {
      id: `@openenvx/studio/${source.slice('#studio/'.length)}`,
      external: true,
    };
  }
  return null;
}

export function studioInternalToPublishedPlugin() {
  return {
    name: 'studio-internal-to-published',
    resolveId(source: string) {
      return resolveStudioInternalAsPublished(source);
    },
  };
}
