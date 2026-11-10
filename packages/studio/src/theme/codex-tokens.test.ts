/** Locks tokens.css to Synara's resolved Codex pack (theme.logic.ts output). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKENS_PATH = join(import.meta.dirname, 'tokens.css');

function readThemeBlock(theme: 'light' | 'dark'): string {
  const css = readFileSync(TOKENS_PATH, 'utf-8');
  const start = css.indexOf(`[data-owb-theme='${theme}']`);
  if (start === -1) {
    throw new Error(`${theme} theme block not found`);
  }
  const nextTheme = theme === 'light' ? 'dark' : null;
  const endMarker = nextTheme
    ? `\n[data-owb-theme='${nextTheme}']`
    : '\n/* Tailwind preflight subset';
  const end = css.indexOf(endMarker, start + 1);
  if (end === -1) {
    throw new Error(`${theme} theme block end not found`);
  }
  return css.slice(start, end);
}

function readToken(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) {
    throw new Error(`${name} not found`);
  }
  return match[1].replaceAll(/\s+/g, ' ').trim();
}

describe('Synara Codex token lock', () => {
  const light = readThemeBlock('light');
  const dark = readThemeBlock('dark');

  it('matches Synara Codex light', () => {
    expect(readToken(light, '--background')).toBe('#ffffff');
    expect(readToken(light, '--foreground')).toBe('#0d0d0d');
    expect(readToken(light, '--muted-foreground')).toBe(
      'rgba(13, 13, 13, 0.598)'
    );
    expect(readToken(light, '--border')).toBe('rgba(13, 13, 13, 0.069)');
    expect(readToken(light, '--primary')).toBe('#0d0d0d');
    expect(readToken(light, '--ring')).toBe('#0169cc');
    expect(readToken(light, '--color-border-focus')).toBe('#0169cc');
    expect(readToken(light, '--color-background-elevated-secondary')).toBe(
      'rgba(13, 13, 13, 0.04)'
    );
    expect(readToken(light, '--color-text-foreground-secondary')).toBe(
      'rgba(13, 13, 13, 0.598)'
    );
  });

  it('matches Synara Codex dark', () => {
    expect(readToken(dark, '--background')).toBe('#101010');
    expect(readToken(dark, '--card')).toBe('#131313');
    expect(readToken(dark, '--foreground')).toBe('#fcfcfc');
    expect(readToken(dark, '--border')).toBe('rgba(252, 252, 252, 0.072)');
    expect(readToken(dark, '--input')).toBe('rgb(23, 23, 23)');
    expect(readToken(dark, '--primary-foreground')).toBe('#111111');
    expect(readToken(dark, '--ring')).toBe('rgba(51, 134, 214, 0.63)');
    expect(readToken(dark, '--color-background-button-secondary-hover')).toBe(
      'rgba(252, 252, 252, 0.039)'
    );
    expect(readToken(dark, '--color-background-surface')).toBe('#111111');
  });
});
