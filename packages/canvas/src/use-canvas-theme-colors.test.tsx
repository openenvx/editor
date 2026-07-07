import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCanvasThemeColors } from './use-canvas-theme-colors';

function ThemeColorReader() {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useCanvasThemeColors(ref);
  return (
    <div ref={ref} data-testid="container">
      <span data-testid="artboard">{colors.artboard}</span>
      <span data-testid="border">{colors.artboardBorder}</span>
      <span data-testid="shadow">{colors.artboardShadow}</span>
      <span data-testid="selection">{colors.selection}</span>
      <span data-testid="foreground">{colors.foreground}</span>
    </div>
  );
}

afterEach(cleanup);

describe('useCanvasThemeColors', () => {
  it('reads theme colors from CSS variables', () => {
    const variables: Record<string, string> = {
      '--wb-artboard': '#fafafa',
      '--wb-artboard-border': '#d4d4d8',
      '--wb-artboard-shadow-color': 'rgba(0, 0, 0, 0.2)',
      '--wb-selection': '#2563eb',
      '--wb-foreground': '#18181b',
    };
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => variables[name] || '',
    } as unknown as CSSStyleDeclaration);

    render(<ThemeColorReader />);
    expect(screen.getByTestId('artboard').textContent).toBe('#fafafa');
    expect(screen.getByTestId('border').textContent).toBe('#d4d4d8');
    expect(screen.getByTestId('shadow').textContent).toBe(
      'rgba(0, 0, 0, 0.2)'
    );
    expect(screen.getByTestId('selection').textContent).toBe('#2563eb');
    expect(screen.getByTestId('foreground').textContent).toBe('#18181b');

    vi.restoreAllMocks();
  });

  it('falls back to defaults when CSS variables are undefined', () => {
    render(<ThemeColorReader />);
    expect(screen.getByTestId('artboard').textContent).toBe('#ffffff');
    expect(screen.getByTestId('border').textContent).toBe('#e5e7eb');
    expect(screen.getByTestId('shadow').textContent).toBe(
      'rgba(0, 0, 0, 0.35)'
    );
    expect(screen.getByTestId('selection').textContent).toBe('#3b82f6');
    expect(screen.getByTestId('foreground').textContent).toBe('#ffffff');
  });
});
