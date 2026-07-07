import { describe, expect, it } from 'vitest';

import { isLayerEditable, isLayerLocked, isLayerWritable } from './layer-editability';
import type { Layer } from './types';

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    data: {},
    editable: overrides.editable ?? true,
    id: 'layer-1',
    locked: overrides.locked ?? false,
    type: 'canvas.text',
    ...overrides,
  };
}

describe('isLayerEditable', () => {
  it('returns true when editable is undefined (default behavior)', () => {
    const layer = createLayer({ editable: undefined });
    expect(isLayerEditable(layer)).toBe(true);
  });

  it('returns true when editable is true', () => {
    const layer = createLayer({ editable: true });
    expect(isLayerEditable(layer)).toBe(true);
  });

  it('returns false when editable is false', () => {
    const layer = createLayer({ editable: false });
    expect(isLayerEditable(layer)).toBe(false);
  });
});

describe('isLayerLocked', () => {
  it('returns false when locked is undefined or false', () => {
    expect(isLayerLocked(createLayer({ locked: undefined }))).toBe(false);
    expect(isLayerLocked(createLayer({ locked: false }))).toBe(false);
  });

  it('returns true when locked is true', () => {
    expect(isLayerLocked(createLayer({ locked: true }))).toBe(true);
  });
});

describe('isLayerWritable', () => {
  it('returns true when editable and not locked', () => {
    expect(isLayerWritable(createLayer({ editable: true, locked: false }))).toBe(
      true
    );
  });

  it('returns false when locked', () => {
    expect(isLayerWritable(createLayer({ editable: true, locked: true }))).toBe(
      false
    );
  });

  it('returns false when config-locked (editable false)', () => {
    expect(isLayerWritable(createLayer({ editable: false, locked: false }))).toBe(
      false
    );
  });

  it('returns false when both config-locked and runtime-locked', () => {
    expect(isLayerWritable(createLayer({ editable: false, locked: true }))).toBe(
      false
    );
  });
});
