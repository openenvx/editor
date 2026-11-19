import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const STUDIO_SRC = join(import.meta.dirname, '..');
/** Document runtime symbols belong in `@openenvx/editor`, not studio src. */
const FORBIDDEN_SYMBOLS = ['DocumentStore', 'initialScene'] as const;

/** Legacy scene/document source trees must not live under studio `src/`. */
const FORBIDDEN_PATH_SEGMENTS = ['scene', 'document'] as const;

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    if (entry.isDirectory()) {
      walkFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('studio package boundary', () => {
  it('has no forbidden document symbols in studio src', () => {
    const files = walkFiles(STUDIO_SRC);
    const hits: string[] = [];
    for (const file of files) {
      const rel = relative(STUDIO_SRC, file);
      if (
        rel.startsWith('test/') ||
        rel.startsWith('scene/') ||
        rel.endsWith('.test.ts') ||
        rel.endsWith('.test.tsx')
      ) {
        continue;
      }
      const text = readFileSync(file, 'utf-8');
      for (const symbol of FORBIDDEN_SYMBOLS) {
        if (text.includes(symbol)) {
          hits.push(`${rel}: ${symbol}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('has no editor/scene/document path segments in filenames', () => {
    const files = walkFiles(STUDIO_SRC);
    const hits = files
      .map((file) => relative(STUDIO_SRC, file))
      .filter((rel) => {
        const parts = rel.split('/');
        return parts.some((part) =>
          FORBIDDEN_PATH_SEGMENTS.includes(part.toLowerCase())
        );
      });
    expect(hits).toEqual([]);
  });
});