import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const coreRoot = import.meta.dirname;
const studioSrc = path.join(coreRoot, '..');

const forbiddenShellSegments = new Set([
  'context',
  'dialogs',
  'fields',
  'hooks',
  'icons',
  'inputs',
  'layout',
  'primitives',
  'renderers',
  'shell',
  'theme',
  'views',
  'version-history',
  'i18n',
  'plugins',
  'test',
]);

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }
    if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      files.push(full);
    }
  }
  return files;
}

function forbiddenUiImport(file: string, line: string): string | null {
  const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
  if (!fromMatch) {
    return null;
  }
  const spec = fromMatch[1];
  if (spec === '@openenvx/studio/internal') {
    return 'studio/internal';
  }
  if (/^@openenvx\/studio$/.test(spec)) {
    return 'studio shell entry';
  }
  if (!spec.startsWith('.')) {
    return null;
  }
  const resolved = path.normalize(path.join(path.dirname(file), spec));
  if (!resolved.startsWith(studioSrc) || resolved.startsWith(coreRoot)) {
    return null;
  }
  const rel = path.relative(studioSrc, resolved);
  const top = rel.split(path.sep)[0];
  if (top && forbiddenShellSegments.has(top)) {
    return top;
  }
  return null;
}

describe('studio core boundary', () => {
  it('src/core does not import workbench UI modules', () => {
    const violations: string[] = [];
    for (const file of collectTsFiles(coreRoot)) {
      const rel = path.relative(studioSrc, file);
      const lines = readFileSync(file, 'utf-8').split('\n');
      for (const [index, line] of lines.entries()) {
        const hit = forbiddenUiImport(file, line);
        if (hit) {
          violations.push(`${rel}:${index + 1} imports ${hit}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
