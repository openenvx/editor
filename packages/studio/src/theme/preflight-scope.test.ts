import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKENS_PATH = join(import.meta.dirname, 'tokens.css');

describe('preflight scope', () => {
  const css = readFileSync(TOKENS_PATH, 'utf-8');
  const start = css.indexOf('/* Tailwind preflight subset');
  const end = css.indexOf('\n[data-owb-theme] {', start);

  it('scopes Synara preflight to workbench chrome', () => {
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const preflight = css.slice(start, end);
    expect(preflight).toContain(':where([data-owb-chrome])');
    expect(preflight).not.toMatch(/:where\(\[data-owb-theme\]\)\s*\*/);
  });
});
