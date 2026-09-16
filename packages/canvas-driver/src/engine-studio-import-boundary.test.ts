import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = import.meta.dirname;

function collectEngineTsFiles(dir: string, relative = ''): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectEngineTsFiles(path.join(dir, entry.name), rel));
      continue;
    }
    if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      files.push(rel);
    }
  }
  return files;
}

describe('canvas engine import boundary', () => {
  it('engine sources do not import @openenvx/studio shell entry', () => {
    const violations: string[] = [];
    for (const rel of collectEngineTsFiles(srcRoot)) {
      const file = path.join(srcRoot, rel);
      const lines = readFileSync(file, 'utf-8').split('\n');
      for (const [index, line] of lines.entries()) {
        if (/from\s+['"]@openenvx\/studio['"]/.test(line)) {
          violations.push(`${rel}:${index + 1}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
