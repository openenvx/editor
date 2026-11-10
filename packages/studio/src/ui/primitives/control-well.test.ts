/** Locks inspector control height token. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKENS_PATH = join(import.meta.dirname, '../../theme/tokens.css');

describe('control-height token', () => {
  it('defines 32px inspector control height', () => {
    const css = readFileSync(TOKENS_PATH, 'utf-8');
    expect(css).toMatch(/--control-height:\s*2rem;/);
  });
});
