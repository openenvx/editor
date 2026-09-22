import { afterEach, describe, expect, it } from 'vitest';

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
  isLayerShownInLayers,
  isLayerWritable,
  isLayoutRootLayer,
  isTemplatePolicyEnforced,
  setTemplatePolicyEnforced,
  withFrozenLayerSnapshots,
} from './layer-editability';
import { SceneStore } from './scene-store';
import type { Layer, Scene } from './types';

afterEach(() => {
  setTemplatePolicyEnforced(true);
});

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: 'layer-1',
    locked: overrides.locked ?? false,
    props: {},
    type: 'canvas.text',
    writeMode: overrides.writeMode ?? 'free',
    ...overrides,
  };
}

function createScene(overrides: Partial<Scene> = {}): Scene {
  return {
    artboards: [
      {
        extensions: { extensions: { layout: 'absolute' } },
        id: 'page-1',
        name: 'Page',
        nodes: [],
        physical: { dpi: 96, unit: 'px' },
        space: { height: 100, width: 100 },
      },
    ],
    ...overrides,
  };
}

const baseFrame = {
  height: 10,
  rotation: 0,
  width: 10,
  x: 1,
  y: 2,
};

const frozenFrame = {
  ...baseFrame,
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
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

  it('respects allowedPropKeys for content mode', () => {
    const layer = createLayer({
      allowedPropKeys: ['html'],
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
        allowArtboardResize: true,
        version: 1,
      },
    });

    expect(canDeleteLayer(createLayer({ writeMode: 'free' }), scene)).toBe(
      false
    );
  });

  it('blocks delete of layout root layers', () => {
    const scene = createScene();
    expect(
      canDeleteLayer(createLayer({ type: 'html.root', writeMode: 'free' }), scene)
    ).toBe(false);
    expect(
      canDeleteLayer(
        createLayer({ type: 'email.root', writeMode: 'free' }),
        scene
      )
    ).toBe(false);
    expect(isLayoutRootLayer(createLayer({ type: 'html.root' }))).toBe(true);
    expect(isLayoutRootLayer(createLayer({ type: 'email.root' }))).toBe(true);
    expect(isLayoutRootLayer(createLayer({ type: 'canvas.text' }))).toBe(false);
  });

  it('blocks insert when allowInsertLayers is false', () => {
    const scene = createScene({
      templatePolicy: {
        allowDeleteLayers: true,
        allowDuplicateLayers: true,
        allowInsertLayers: false,
        allowArtboardResize: true,
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
        allowArtboardResize: true,
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
      artboards: [
        {
          extensions: { layout: 'absolute' },
          id: 'page-1',
          name: 'Page',
          nodes: [
            createLayer({
              frame: { ...baseFrame },
              id: 'bg',
              props: { html: '<p>x</p>' },
              writeMode: 'locked',
            }),
          ],
          physical: { dpi: 96, unit: 'px' },
          space: { height: 100, width: 100 },
        },
      ],
    });

    const frozen = buildFrozenLayerSnapshot(scene);
    expect(frozen.bg?.props).toEqual({ html: '<p>x</p>' });
    expect(frozen.bg?.frame).toEqual(frozenFrame);
  });

  it('freezes transform only for content layers', () => {
    const scene = createScene({
      artboards: [
        {
          id: 'page-1',
          nodes: [
            createLayer({
              props: { html: '<p>editable</p>' },
              id: 'title',
              frame: { ...baseFrame },
              writeMode: 'content',
            }),
          ],
          extensions: { layout: 'absolute' },
          name: 'Page',
          physical: { dpi: 96, unit: 'px' },
          space: { height: 100, width: 100 },
        },
      ],
    });

    const frozen = buildFrozenLayerSnapshot(scene);
    expect(frozen.title?.props).toBeUndefined();
    expect(frozen.title?.frame).toEqual(frozenFrame);
  });

  it('freezes data only for properties layers', () => {
    const scene = createScene({
      artboards: [
        {
          id: 'page-1',
          nodes: [
            createLayer({
              props: { foregroundColor: '#000' },
              id: 'qr',
              frame: { ...baseFrame, x: 0, y: 0 },
              type: 'wedding.qr',
              writeMode: 'properties',
            }),
          ],
          extensions: { layout: 'absolute' },
          name: 'Page',
          physical: { dpi: 96, unit: 'px' },
          space: { height: 100, width: 100 },
        },
      ],
    });

    const frozen = buildFrozenLayerSnapshot(scene);
    expect(frozen.qr?.props).toEqual({ foregroundColor: '#000' });
    expect(frozen.qr?.frame).toBeUndefined();
  });
});

describe('applyFrozenLayerPolicy', () => {
  it('restores frozen fields and leaves editable ones', () => {
    const scene = createScene({
      artboards: [
        {
          id: 'page-1',
          nodes: [
            createLayer({
              props: { html: '<p>changed</p>' },
              id: 'title',
              frame: { ...baseFrame, x: 99 },
              writeMode: 'content',
            }),
            createLayer({
              props: { fill: '#fff' },
              id: 'badge',
              frame: { ...baseFrame, x: 50 },
              writeMode: 'properties',
            }),
          ],
          extensions: { layout: 'absolute' },
          name: 'Page',
          physical: { dpi: 96, unit: 'px' },
          space: { height: 100, width: 100 },
        },
      ],
      templatePolicy: {
        allowDeleteLayers: true,
        allowDuplicateLayers: true,
        allowInsertLayers: true,
        allowArtboardResize: true,
        frozenNodes: {
          badge: { props: { fill: '#000' } },
          title: { frame: { ...baseFrame } },
        },
        version: 1,
      },
    });

    const next = applyFrozenLayerPolicy(scene);
    const title = next.artboards[0]!.nodes[0]!;
    const badge = next.artboards[0]!.nodes[1]!;
    expect(title.props).toEqual({ html: '<p>changed</p>' });
    expect(title.frame).toEqual(baseFrame);
    expect(badge.props).toEqual({ fill: '#000' });
    expect(badge.frame?.x).toBe(50);
  });
});

describe('withFrozenLayerSnapshots + SceneStore', () => {
  it('persists snapshots and enforces them on apply', () => {
    const authored = withFrozenLayerSnapshots(
      createScene({
        artboards: [
          {
            id: 'page-1',
            nodes: [
              createLayer({
                props: { html: '<p>tmpl</p>' },
                id: 'locked-bg',
                frame: { ...baseFrame },
                writeMode: 'locked',
              }),
            ],
            extensions: { layout: 'absolute' },
            name: 'Page',
            physical: { dpi: 96, unit: 'px' },
            space: { height: 100, width: 100 },
          },
        ],
        templatePolicy: {
          allowDeleteLayers: false,
          allowDuplicateLayers: false,
          allowInsertLayers: false,
          allowArtboardResize: false,
          version: 1,
        },
      })
    );

    expect(authored.templatePolicy?.frozenNodes?.['locked-bg']?.props).toEqual({
      html: '<p>tmpl</p>',
    });

    const store = new SceneStore(authored);
    store.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) => ({
          ...page,
          nodes: page.nodes.map((layer) =>
            layer.id === 'locked-bg'
              ? {
                  ...layer,
                  props: { html: '<p>hacked</p>' },
                  frame: { ...baseFrame, x: 999 },
                }
              : layer
          ),
        })),
      }),
      label: 'Attempt freeze breach',
    });

    const layer = store.getDocument().artboards[0]!.nodes[0]!;
    expect(layer.props).toEqual({ html: '<p>tmpl</p>' });
    expect(layer.frame).toEqual(baseFrame);
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

describe('isLayerShownInLayers', () => {
  it('defaults to true when absent', () => {
    expect(isLayerShownInLayers(createLayer())).toBe(true);
  });

  it('returns false when showInLayers is false', () => {
    expect(isLayerShownInLayers(createLayer({ showInLayers: false }))).toBe(
      false
    );
  });
});

describe('template policy enforcement', () => {
  it('defaults to enforced', () => {
    expect(isTemplatePolicyEnforced()).toBe(true);
  });

  it('ignores writeMode when not enforced (authoring)', () => {
    setTemplatePolicyEnforced(false);
    const locked = createLayer({ writeMode: 'locked' });
    expect(isLayerEditable(locked)).toBe(true);
    expect(canSelectLayer(locked)).toBe(true);
    expect(canTransformLayer(locked)).toBe(true);
    expect(canEditLayerData(locked)).toBe(true);
  });

  it('still respects runtime locked when not enforced', () => {
    setTemplatePolicyEnforced(false);
    expect(
      canTransformLayer(createLayer({ writeMode: 'locked', locked: true }))
    ).toBe(false);
  });

  it('blocks select when showInLayers is false and enforced', () => {
    expect(
      canSelectLayer(createLayer({ showInLayers: false, writeMode: 'free' }))
    ).toBe(false);
  });

  it('allows select for content-mode face parts hidden from Layers', () => {
    expect(
      canSelectLayer(
        createLayer({ showInLayers: false, writeMode: 'content' })
      )
    ).toBe(true);
  });

  it('allows select when showInLayers is false and not enforced', () => {
    setTemplatePolicyEnforced(false);
    expect(
      canSelectLayer(createLayer({ showInLayers: false, writeMode: 'locked' }))
    ).toBe(true);
  });

  it('ignores templatePolicy insert/delete when not enforced', () => {
    setTemplatePolicyEnforced(false);
    const scene = createScene({
      templatePolicy: {
        allowDeleteLayers: false,
        allowDuplicateLayers: false,
        allowInsertLayers: false,
        allowArtboardResize: false,
        version: 1,
      },
    });
    expect(canInsertLayers(scene)).toBe(true);
    expect(canDeleteLayer(createLayer({ writeMode: 'free' }), scene)).toBe(
      true
    );
  });
});
