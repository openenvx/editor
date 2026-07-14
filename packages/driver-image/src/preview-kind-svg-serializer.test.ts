import { describe, expect, it } from 'vitest';

import { PreviewKindSvgSerializerRegistry } from './preview-kind-svg-serializer';

describe('PreviewKindSvgSerializerRegistry', () => {
  it('rejects duplicate kinds without override', () => {
    const registry = new PreviewKindSvgSerializerRegistry();
    registry.register({
      kind: 'image',
      toSvgFragment: () => '<image />',
    });
    expect(() =>
      registry.register({
        kind: 'image',
        toSvgFragment: () => '<image override />',
      })
    ).toThrow(/already registered/i);
  });

  it('allows overriding an existing serializer kind', () => {
    const registry = new PreviewKindSvgSerializerRegistry();
    registry.register({
      kind: 'image',
      toSvgFragment: () => '<image />',
    });
    registry.register(
      {
        kind: 'image',
        toSvgFragment: () => '<image override />',
      },
      { override: true }
    );
    expect(registry.get('image')?.toSvgFragment({ kind: 'image' }, {} as never)).toBe(
      '<image override />'
    );
  });
});
