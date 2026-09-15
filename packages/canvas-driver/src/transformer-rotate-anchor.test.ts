import { describe, expect, it, vi } from 'vitest';

import {
  createRotateAnchorSvgDataUrl,
  styleTransformerRotateAnchor,
  TRANSFORMER_ROTATE_ANCHOR_SIZE,
} from './transformer-rotate-anchor';

describe('transformer-rotate-anchor', () => {
  it('rejects unsafe stroke colors in the SVG', () => {
    const dataUrl = createRotateAnchorSvgDataUrl('"><script>');
    const svg = decodeURIComponent(
      dataUrl.replace('data:image/svg+xml;charset=utf-8,', '')
    );
    expect(svg).toContain('stroke="#3b82f6"');
    expect(svg).not.toContain('script');
  });

  it('styles only the rotater anchor', () => {
    const rotater = {
      cornerRadius: vi.fn(),
      fill: vi.fn(),
      fillPatternImage: vi.fn(),
      fillPatternOffset: vi.fn(),
      fillPatternRepeat: vi.fn(),
      fillPatternScale: vi.fn(),
      fillPriority: vi.fn(),
      hasName: (name: string) => name === 'rotater',
      height: vi.fn(),
      offsetX: vi.fn(),
      offsetY: vi.fn(),
      strokeEnabled: vi.fn(),
      width: vi.fn(),
    };
    const corner = {
      hasName: () => false,
      width: vi.fn(),
    };

    styleTransformerRotateAnchor(corner as never, null);
    expect(corner.width).not.toHaveBeenCalled();

    styleTransformerRotateAnchor(rotater as never, null);
    expect(rotater.width).toHaveBeenCalledWith(TRANSFORMER_ROTATE_ANCHOR_SIZE);
  });
});
