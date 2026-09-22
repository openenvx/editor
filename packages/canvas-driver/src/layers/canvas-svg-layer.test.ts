import { describe, expect, it } from 'vitest';

import { testArtboard } from '../test/canvas-document-fixtures';
import { CanvasSvgLayer } from './canvas-svg-layer';

describe('CanvasSvgLayer', () => {
  const layer = new CanvasSvgLayer();

  it('validates svg data', () => {
    expect(layer.validate({ svg: '<svg viewBox="0 0 10 10"></svg>' })).toBe(
      true
    );
    expect(layer.validate({})).toBe(false);
  });

  it('creates a default layer with svg markup', () => {
    const created = layer.createDefault('svg-1', testArtboard({ id: 'p1' }));
    expect(created.type).toBe('canvas.svg');
    expect(typeof (created.props as { svg?: string }).svg).toBe('string');
  });

  it('renders svg preview kind', () => {
    const preview = layer.renderPreview({
      layer: {
        props: { fill: '#f00', svg: '<svg></svg>' },
        id: 's1',
        type: 'canvas.svg',
      },
      model: { fill: '#f00', svg: '<svg></svg>' },
      page: testArtboard({ id: 'p1' }),
    });
    expect(preview).toMatchObject({ fill: '#f00', kind: 'svg', svg: '<svg></svg>' });
  });
});
