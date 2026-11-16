/** Locks inspector control well recipe (tokens + shared CSS module). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKENS_PATH = join(import.meta.dirname, '../../theme/tokens.css');
const WELL_CSS_PATH = join(import.meta.dirname, 'control-well.module.css');

describe('inspector control well', () => {
  it('defines 32px inspector control height', () => {
    const css = readFileSync(TOKENS_PATH, 'utf-8');
    expect(css).toMatch(/--control-height:\s*2rem;/);
  });

  it('defines light and dark control-well fills', () => {
    const css = readFileSync(TOKENS_PATH, 'utf-8');
    expect(css).toMatch(/--control-well:\s*rgba\(13,\s*13,\s*13,\s*0\.04\)/);
    expect(css).toMatch(
      /--control-well:\s*rgba\(252,\s*252,\s*252,\s*0\.07\)/
    );
  });

  it('uses transparent hairline, lg radius, and well fill in shared module', () => {
    const css = readFileSync(WELL_CSS_PATH, 'utf-8');
    expect(css).toContain('var(--control-well)');
    expect(css).toContain('var(--control-height)');
    expect(css).toContain('border: 1px solid transparent');
    expect(css).toContain('border-radius: var(--radius)');
    expect(css).toContain('border-color: var(--color-border-focus)');
  });
});