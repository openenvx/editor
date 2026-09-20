/** CJS `require("…")` in inlined deps → ESM imports so Next can alias host React. */
export const reactEsmExternals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-dom/client',
  'react-reconciler',
  'scheduler',
  'use-sync-external-store',
];

export function isReactEsmExternalId(id: string): boolean {
  return reactEsmExternals.some((e) => id === e || id.startsWith(`${e}/`));
}

/**
 * Rolldown `external` for packages that must not be inlined (ESM `import` in dist).
 * `scheduler` stays off this list so CJS `require("scheduler")` is rewritten by
 * esmExternalRequirePlugin rather than left as a CJS require.
 */
export const hostReactRuntimePackageExternals = [
  'react-reconciler',
  'use-sync-external-store',
];

export function isHostReactRuntimePackageExternal(id: string): boolean {
  return hostReactRuntimePackageExternals.some(
    (e) => id === e || id.startsWith(`${e}/`)
  );
}
