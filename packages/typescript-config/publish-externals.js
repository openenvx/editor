/** React peers kept external in published browser bundles. */
export const REACT_PUBLISH_EXTERNALS = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react-dom/client',
];

/** Published @openenvx/studio subpaths (cross-entry graph). */
export const STUDIO_SUBPATH_EXTERNALS = [
  '@openenvx/studio',
  '@openenvx/studio/core',
  '@openenvx/studio/schema',
  '@openenvx/studio/preview',
  '@openenvx/studio/react',
];

/** Legacy + studio + sandbox package imports for artboard publish bundles. */
export const OPENENVX_ARTBOARD_EXTERNALS = [
  '@openenvx/core',
  '@openenvx/core/react',
  '@openenvx/core/schema',
  '@openenvx/core/preview',
  ...STUDIO_SUBPATH_EXTERNALS,
  '@openenvx/editor-sandbox',
  '@openenvx/editor-sandbox/host',
  '@openenvx/editor-sandbox/protocol',
  '@openenvx/editor-sandbox/canvas-widget',
];

export function studioCoreExternals() {
  return [...REACT_PUBLISH_EXTERNALS];
}

/**
 * Externals when bundling published studio core export entries.
 * Subpaths stay separate bundles; third-party deps are inlined.
 */
export function studioCoreEntryExternals() {
  return [...REACT_PUBLISH_EXTERNALS, ...STUDIO_SUBPATH_EXTERNALS];
}

/**
 * @param {object} [_pkg]
 */
export function studioShellExternals(_pkg) {
  return [
    ...REACT_PUBLISH_EXTERNALS,
    ...STUDIO_SUBPATH_EXTERNALS,
    '@openenvx/editor-sandbox',
    '@openenvx/editor-sandbox/host',
    '@openenvx/editor-sandbox/protocol',
  ];
}

/**
 * @param {object} pkg package.json
 */
export function artboardPublishExternals(pkg) {
  const peers = Object.keys(pkg.peerDependencies ?? {});
  return [
    ...OPENENVX_ARTBOARD_EXTERNALS,
    ...peers,
    'react/jsx-runtime',
    'react-dom/client',
  ];
}

/**
 * @param {string} content
 * @param {string[]} moduleIds bare package names (e.g. zod, @dnd-kit/core)
 * @returns {string | null} first forbidden match or null
 */
export function findBareImport(content, moduleIds) {
  for (const id of moduleIds) {
    const pattern = new RegExp(
      `from\\s*["']${escapeRegExp(id)}(?:/[^"']*)?["']`
    );
    const match = pattern.exec(content);
    if (match) {
      return id;
    }
  }
  return null;
}

/**
 * @param {string} content
 * @param {string[]} moduleIds
 * @returns {RegExp} matches if any bare import is present
 */
export function bareImportPattern(moduleIds) {
  const parts = moduleIds.map(
    (id) => `from\\s*["']${escapeRegExp(id)}(?:/[^"']*)?["']`
  );
  return new RegExp(parts.join('|'));
}

/**
 * @param {string} s
 */
function escapeRegExp(s) {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Merge npm publishConfig into the shape consumers see on the registry.
 * @param {Record<string, unknown>} pkg
 */
export function mergePublishPackageJson(pkg) {
  const publish = pkg.publishConfig;
  if (!publish || typeof publish !== 'object') {
    return pkg;
  }
  const merged = { ...pkg, ...publish };
  if (publish.exports) {
    merged.exports = publish.exports;
  }
  return merged;
}
