/**
 * Locks `--wb-*` chrome to Synara Codex (DEFAULT_THEME_STATE).
 * Reference: apps/web `buildThemeCssVariables` in github.com/Emanuele-web04/synara.
 */
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
  const endMarker = nextTheme ? `\n[data-owb-theme='${nextTheme}']` : '\n[data-owb-theme],';
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

  it('matches Codex light chrome', () => {
    expect(readToken(light, '--wb-background')).toBe('#ffffff');
    expect(readToken(light, '--wb-card')).toBe('#ffffff');
    expect(readToken(light, '--wb-foreground')).toBe('#0d0d0d');
    expect(readToken(light, '--wb-muted-foreground')).toBe('rgba(13, 13, 13, 0.598)');
    expect(readToken(light, '--wb-border')).toBe('rgba(13, 13, 13, 0.069)');
    expect(readToken(light, '--wb-muted')).toBe('rgba(13, 13, 13, 0.04)');
    expect(readToken(light, '--wb-hover-overlay')).toBe('rgba(13, 13, 13, 0.03)');
    expect(readToken(light, '--wb-sidebar-row-selected')).toBe('rgba(13, 13, 13, 0.03)');
    expect(readToken(light, '--wb-seam-line')).toBe('rgba(0, 0, 0, 0.05)');
    expect(readToken(light, '--wb-menu')).toBe('rgba(255, 255, 255, 0.96)');
    expect(readToken(light, '--wb-primary')).toBe('#0d0d0d');
    expect(readToken(light, '--wb-focus')).toBe('#0169cc');
    expect(readToken(light, '--wb-destructive')).toBe('#e02e2a');
    expect(readToken(light, '--wb-accent')).toBe('#e8f2fa');
    expect(readToken(light, '--wb-sidebar-surface')).toBe(
      'color-mix(in srgb, #ffffff 38%, #e0e0e0)'
    );
  });

  it('matches Codex dark chrome', () => {
    expect(readToken(dark, '--wb-background')).toBe('#101010');
    expect(readToken(dark, '--wb-card')).toBe('#131313');
    expect(readToken(dark, '--wb-foreground')).toBe('#fcfcfc');
    expect(readToken(dark, '--wb-muted-foreground')).toBe('rgba(252, 252, 252, 0.58)');
    expect(readToken(dark, '--wb-border')).toBe('rgba(252, 252, 252, 0.072)');
    expect(readToken(dark, '--wb-muted')).toBe('rgba(252, 252, 252, 0.026)');
    expect(readToken(dark, '--wb-hover-overlay')).toBe('rgba(252, 252, 252, 0.039)');
    expect(readToken(dark, '--wb-sidebar-row-selected')).toBe('rgba(252, 252, 252, 0.026)');
    expect(readToken(dark, '--wb-input-fill')).toBe('rgb(23, 23, 23)');
    expect(readToken(dark, '--wb-menu')).toBe('rgba(23, 23, 23, 0.96)');
    expect(readToken(dark, '--wb-primary')).toBe('#fcfcfc');
    expect(readToken(dark, '--wb-primary-foreground')).toBe('#111111');
    expect(readToken(dark, '--wb-focus')).toBe('rgba(51, 134, 214, 0.63)');
    expect(readToken(dark, '--wb-destructive')).toBe('#e02e2a');
    expect(readToken(dark, '--wb-sidebar-surface')).toBe(
      'color-mix(in srgb, #111111 80%, #000000)'
    );
  });
});
