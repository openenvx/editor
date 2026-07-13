import { describe, expect, it } from 'vitest';

import {
  buildFrozenLayerSnapshot,
  canDeleteLayer,
  canDuplicateLayer,
  canEditLayerData,
  canInsertLayers,
  canSelectLayer,
  canTransformLayer,
  getLayerWriteMode,
  isLayerEditable,
  isLayerLocked,
  isLayerWritable,
} from './layer-editability';
import type { Layer, Scene } from './types';

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    data: {},
    id: 'layer-1',
    locked: overrides.locked ?? false,
    type: 'canvas.text',
    writeMode: overrides.writeMode ?? 'free',
    ...overrides,
  };
}

function createScene(overrides: Partial<Scene> = {}): Scene {
  return {
    activePageId: 'page-1',
    pages: [
      {
        id: 'page-1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
        height: 100,
        width: 100,
      },
    ],
    schemaVersion: 1,
    selection: {
      activePageId: 'page-1',
      primaryLayerId: null,
      selectedLayerIds: [],
    },
    ...overrides,
  };
}

describe('getLayerWriteMode', () => {
  it('defaults to free when writeMode is missing', () => {
    expect(getLayerWriteMode(createLayer({ writeMode: undefined }))).toBe(
      'free'
    );
  });

  it('returns explicit writeMode', () => {
    expect(getLayerWriteMode(createLayer({ writeMode: 'content' }))).toBe(
      'content'
    );
  });
});

describe('isLayerEditable', () => {
  it('returns false for locked writeMode', () => {
    expect(isLayerEditable(createLayer({ writeMode: 'locked' }))).toBe(false);
  });

  it('returns true for content writeMode', () => {
    expect(isLayerEditable(createLayer({ writeMode: 'content' }))).toBe(true);
  });
});

describe('canSelectLayer', () => {
  it('returns false for locked layers', () => {
    expect(canSelectLayer(createLayer({ writeMode: 'locked' }))).toBe(false);
  });

  it('returns true for content layers', () => {
    expect(canSelectLayer(createLayer({ writeMode: 'content' }))).toBe(true);
  });
});

describe('canTransformLayer', () => {
  it('allows only free mode', () => {
    expect(canTransformLayer(createLayer({ writeMode: 'free' }))).toBe(true);
    expect(canTransformLayer(createLayer({ writeMode: 'content' }))).toBe(false);
    expect(canTransformLayer(createLayer({ writeMode: 'properties' }))).toBe(
      false
    );
  });

  it('returns false when runtime locked', () => {
    expect(
      canTransformLayer(createLayer({ writeMode: 'free', locked: true }))
    ).toBe(false);
  });
});

describe('canEditLayerData', () => {
  it('allows content and properties modes', () => {
    expect(canEditLayerData(createLayer({ writeMode: 'content' }))).toBe(true);
    expect(canEditLayerData(createLayer({ writeMode: 'properties' }))).toBe(
      true
    );
    expect(canEditLayerData(createLayer({ writeMode: 'locked' }))).toBe(false);
  });
});

describe('templatePolicy', () => {
  it('blocks delete when allowDeleteLayers is false', () => {
    const scene = createScene({
      templatePolicy: {
        allowDeleteLayers: false,
        allowDuplicateLayers: true,
        allowInsertLayers: true,
        allowPageResize: true,
        version: 1,
      },
    });

    expect(canDeleteLayer(createLayer({ writeMode: 'free' }), scene)).toBe(
      false
    );
  });

  it('blocks insert when allowInsertLayers is false', () => {
    const scene = createScene({
      templatePolicy: {
        allowDeleteLayers: true,
        allowDuplicateLayers: true,
        allowInsertLayers: false,
        allowPageResize: true,
        version: 1,
      },
    });

    expect(canInsertLayers(scene)).toBe(false);
  });

  it('blocks duplicate when allowDuplicateLayers is false', () => {
    const scene = createScene({
      templatePolicy: {
        allowDeleteLayers: true,
        allowDuplicateLayers: false,
        allowInsertLayers: true,
        allowPageResize: true,
        version: 1,
      },
    });

    expect(canDuplicateLayer(createLayer({ writeMode: 'free' }), scene)).toBe(
      false
    );
  });
});

describe('buildFrozenLayerSnapshot', () => {
  it('freezes data and transform for locked layers', () => {
    const scene = createScene({
      pages: [
        {
          id: 'page-1',
          layers: [
            createLayer({
              data: { html: '<p>x</p>' },
              id: 'bg',
              transform: { height: 10, opacity: 1, rotation: 0, width: 10, x: 1, y: 2 },
              writeMode: 'locked',
            }),
          ],
          layout: 'absolute',
          name: 'Page',
          height: 100,
          width: 100,
        },
      ],
    });

    const frozen = buildFrozenLayerSnapshot(scene);
    expect(frozen.bg?.data).toEqual({ html: '<p>x</p>' });
    expect(frozen.bg?.transform).toEqual({
      height: 10,
      opacity: 1,
      rotation: 0,
      width: 10,
      x: 1,
      y: 2,
    });
  });

  it('freezes transform only for properties layers', () => {
    const scene = createScene({
      pages: [
        {
          id: 'page-1',
          layers: [
            createLayer({
              data: { foregroundColor: '#000' },
              id: 'qr',
              transform: { height: 10, opacity: 1, rotation: 0, width: 10, x: 0, y: 0 },
              type: 'wedding.qr',
              writeMode: 'properties',
            }),
          ],
          layout: 'absolute',
          name: 'Page',
          height: 100,
          width: 100,
        },
      ],
    });

    const frozen = buildFrozenLayerSnapshot(scene);
    expect(frozen.qr?.data).toBeUndefined();
    expect(frozen.qr?.transform).toBeDefined();
  });
});

describe('isLayerLocked', () => {
  it('returns true when locked is true', () => {
    expect(isLayerLocked(createLayer({ locked: true }))).toBe(true);
  });
});

describe('isLayerWritable', () => {
  it('returns false when writeMode is locked', () => {
    expect(isLayerWritable(createLayer({ writeMode: 'locked' }))).toBe(false);
  });
});
