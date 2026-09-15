import { describe, expect, it } from 'vitest';

import { resolveResizeHandleCursor } from './resize-handle-cursor';

describe('resolveResizeHandleCursor', () => {
  it('matches Konva edge cursors at 0° rotation', () => {
    expect(resolveResizeHandleCursor('middle-left', 0)).toBe('ew-resize');
    expect(resolveResizeHandleCursor('middle-right', 0)).toBe('ew-resize');
    expect(resolveResizeHandleCursor('top-center', 0)).toBe('ns-resize');
    expect(resolveResizeHandleCursor('bottom-center', 0)).toBe('ns-resize');
  });

  it('matches Konva corner cursors at 0° rotation', () => {
    expect(resolveResizeHandleCursor('top-left', 0)).toBe('nwse-resize');
    expect(resolveResizeHandleCursor('top-right', 0)).toBe('nesw-resize');
    expect(resolveResizeHandleCursor('bottom-left', 0)).toBe('nesw-resize');
    expect(resolveResizeHandleCursor('bottom-right', 0)).toBe('nwse-resize');
  });

  it('rotates edge cursors with the layer (90°)', () => {
    expect(resolveResizeHandleCursor('middle-left', 90)).toBe('ns-resize');
    expect(resolveResizeHandleCursor('top-center', 90)).toBe('ew-resize');
  });
});
