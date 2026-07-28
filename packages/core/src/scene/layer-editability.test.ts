import { describe, expect, it } from 'vitest';

import {
  applyFrozenLayerPolicy,
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
  withFrozenLayerSnapshots,
} from './layer-editability';
import { SceneStore } from './scene-store';
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
    ...overrides,
  };
}

const baseTransform = {
  height: 10,
  opacity: 1,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  width: 10,
  x: 1,
  y: 2,
};

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
  it('allows free and properties modes', () => {
    expect(canTransformLayer(createLayer({ writeMode: 'free' }))).toBe(true);
    expect(canTransformLayer(createLayer({ writeMode: 'properties' }))).toBe(
      true
    );
    expect(canTransformLayer(createLayer({ writeMode: 'content' }))).toBe(
      false
    );
    expect(canTransformLayer(createLayer({ writeMode: 'locked' }))).toBe(false);
  });

  it('returns false when runtime locked', () => {
    expect(
      canTransformLayer(createLayer({ writeMode: 'free', locked: true }))
    ).toBe(false);
  });
});

describe('canEditLayerData', () => {
  it('allows free and content, not properties', () => {
    expect(canEditLayerData(createLayer({ writeMode: 'free' }))).toBe(true);
    expect(canEditLayerData(createLayer({ writeMode: 'content' }))).toBe(true);
    expect(canEditLayerData(createLayer({ writeMode: 'properties' }))).toBe(
      false
    );
    expect(canEditLayerData(createLayer({ writeMode: 'locked' }))).toBe(false);
  });

  it('respects allowedDataKeys for content mode', () => {
    const layer = createLayer({
      allowedDataKeys: ['html'],
      writeMode: 'content',
    });
    expect(canEditLayerData(layer)).toBe(true);
    expect(canEditLayerData(layer, 'html')).toBe(true);
    expect(canEditLayerData(layer, 'fontSize')).toBe(false);
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
              transform: { ...baseTransform },
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
    expect(frozen.bg?.transform).toEqual(baseTransform);
  });

  it('freezes transform only for content layers', () => {
    const scene = createScene({
      pages: [
        {
          id: 'page-1',
          layers: [
            createLayer({
              data: { html: '<p>editable</p>' },
              id: 'title',
              transform: { ...baseTransform },
              writeMode: 'content',
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
    expect(frozen.title?.data).toBeUndefined();
    expect(frozen.title?.transform).toEqual(baseTransform);
  });

  it('freezes data only for properties layers', () => {
    const scene = createScene({
      pages: [
        {
          id: 'page-1',
          layers: [
            createLayer({
              data: { foregroundColor: '#000' },
              id: 'qr',
              transform: { ...baseTransform, x: 0, y: 0 },
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
    expect(frozen.qr?.data).toEqual({ foregroundColor: '#000' });
    expect(frozen.qr?.transform).toBeUndefined();
  });
});

describe('applyFrozenLayerPolicy', () => {
  it('restores frozen fields and leaves editable ones', () => {
    const scene = createScene({
      pages: [
        {
          id: 'page-1',
          layers: [
            createLayer({
              data: { html: '<p>changed</p>' },
              id: 'title',
              transform: { ...baseTransform, x: 99 },
              writeMode: 'content',
            }),
            createLayer({
              data: { fill: '#fff' },
              id: 'badge',
              transform: { ...baseTransform, x: 50 },
              writeMode: 'properties',
            }),
          ],
          layout: 'absolute',
          name: 'Page',
          height: 100,
          width: 100,
        },
      ],
      templatePolicy: {
        allowDeleteLayers: true,
        allowDuplicateLayers: true,
        allowInsertLayers: true,
        allowPageResize: true,
        frozenLayers: {
          badge: { data: { fill: '#000' } },
          title: { transform: { ...baseTransform } },
        },
        version: 1,
      },
    });

    const next = applyFrozenLayerPolicy(scene);
    const title = next.pages[0]!.layers[0]!;
    const badge = next.pages[0]!.layers[1]!;
    expect(title.data).toEqual({ html: '<p>changed</p>' });
    expect(title.transform).toEqual(baseTransform);
    expect(badge.data).toEqual({ fill: '#000' });
    expect(badge.transform?.x).toBe(50);
  });
});

describe('withFrozenLayerSnapshots + SceneStore', () => {
  it('persists snapshots and enforces them on apply', () => {
    const authored = withFrozenLayerSnapshots(
      createScene({
        pages: [
          {
            id: 'page-1',
            layers: [
              createLayer({
                data: { html: '<p>tmpl</p>' },
                id: 'locked-bg',
                transform: { ...baseTransform },
                writeMode: 'locked',
              }),
            ],
            layout: 'absolute',
            name: 'Page',
            height: 100,
            width: 100,
          },
        ],
        templatePolicy: {
          allowDeleteLayers: false,
          allowDuplicateLayers: false,
          allowInsertLayers: false,
          allowPageResize: false,
          version: 1,
        },
      })
    );

    expect(authored.templatePolicy?.frozenLayers?.['locked-bg']?.data).toEqual({
      html: '<p>tmpl</p>',
    });

    const store = new SceneStore(authored);
    store.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((page) => ({
          ...page,
          layers: page.layers.map((layer) =>
            layer.id === 'locked-bg'
              ? {
                  ...layer,
                  data: { html: '<p>hacked</p>' },
                  transform: { ...baseTransform, x: 999 },
                }
              : layer
          ),
        })),
      }),
      label: 'Attempt freeze breach',
    });

    const layer = store.getScene().pages[0]!.layers[0]!;
    expect(layer.data).toEqual({ html: '<p>tmpl</p>' });
    expect(layer.transform).toEqual(baseTransform);
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
