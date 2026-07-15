import { describe, expect, it } from 'vitest';

import { proposedChangeSchema } from '@openenvx/agent/schemas';

describe('proposedChangeSchema', () => {
  it('accepts executeCommand changes', () => {
    const parsed = proposedChangeSchema.parse({
      kind: 'executeCommand',
      commandId: 'canvas.alignLeft',
    });
    expect(parsed.kind).toBe('executeCommand');
  });

  it('accepts updateProperty changes', () => {
    const parsed = proposedChangeSchema.parse({
      kind: 'updateProperty',
      layerId: 'layer-1',
      key: 'fill',
      value: '#ff0000',
    });
    expect(parsed.kind).toBe('updateProperty');
  });

  it('accepts createLayer and deleteLayer changes', () => {
    expect(
      proposedChangeSchema.parse({
        kind: 'createLayer',
        type: 'rect',
        transform: { x: 0, y: 0, width: 100, height: 100 },
      }).kind
    ).toBe('createLayer');

    expect(
      proposedChangeSchema.parse({
        kind: 'deleteLayer',
        layerIds: ['layer-1'],
      }).kind
    ).toBe('deleteLayer');
  });
});
