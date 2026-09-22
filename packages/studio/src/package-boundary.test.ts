import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const studioSrc = import.meta.dirname;

const headlessEntryFiles = [
  path.join(studioSrc, 'index.ts'),
  path.join(studioSrc, 'schema', 'index.ts'),
  path.join(studioSrc, 'preview', 'index.ts'),
  path.join(studioSrc, 'react', 'workbench-context.tsx'),
];

const forbiddenPackageSpecs = new Set([
  '#studio/shell',
  '#studio/internal',
]);

function resolveRelativeImport(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) {
    return null;
  }
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }
    try {
      if (statSync(candidate).isFile()) {
        return path.normalize(candidate);
      }
    } catch {
      continue;
    }
  }
  return null;
}

function isForbiddenShellPath(absPath: string): string | null {
  if (!absPath.startsWith(studioSrc)) {
    return null;
  }
  const rel = path.relative(studioSrc, absPath);
  const top = rel.split(path.sep)[0];
  const forbiddenTop = new Set([
    'context',
    'hooks',
    'layout',
    'shell',
    'theme',
    'views',
    'ui',
    'workbench-barrel.ts',
  ]);
  if (top && forbiddenTop.has(top)) {
    return top;
  }
  if (
    rel.startsWith(`plugins${path.sep}variables`) ||
    rel.startsWith(`plugins${path.sep}version-history`)
  ) {
    return rel.split(path.sep).slice(0, 2).join('/');
  }
  if (rel.startsWith(`i18n${path.sep}`) && rel.includes('workbench')) {
    return 'i18n/workbench UI';
  }
  if (rel === path.join('properties', 'draft-property-host-context.ts')) {
    return 'properties/draft-property-host-context';
  }
  return null;
}

function walkHeadlessImports(): string[] {
  const violations: string[] = [];
  const queue = headlessEntryFiles.filter((f) => existsSync(f));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || visited.has(file)) {
      continue;
    }
    visited.add(file);
    const relFile = path.relative(studioSrc, file);
    const lines = readFileSync(file, 'utf-8').split('\n');
    for (const [index, line] of lines.entries()) {
      const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
      const sideMatch = line.match(/import\s+['"]([^'"]+)['"]/);
      const spec = fromMatch?.[1] ?? sideMatch?.[1];
      if (!spec) {
        continue;
      }
      if (
        forbiddenPackageSpecs.has(spec) ||
        spec === '@openenvx/studio' ||
        spec.startsWith('@openenvx/studio/')
      ) {
        violations.push(`${relFile}:${index + 1} imports ${spec}`);
        continue;
      }
      const resolved = resolveRelativeImport(file, spec);
      if (!resolved) {
        continue;
      }
      const hit = isForbiddenShellPath(resolved);
      if (hit) {
        violations.push(`${relFile}:${index + 1} imports ${hit}`);
        continue;
      }
      if (resolved.startsWith(studioSrc) && !visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return violations;
}

describe('studio headless boundary', () => {
  it('headless entry graph does not import workbench shell modules', () => {
    expect(walkHeadlessImports()).toEqual([]);
  });

  it('headless entries exist', () => {
    for (const entry of headlessEntryFiles) {
      expect(existsSync(entry), entry).toBe(true);
    }
  });
});
