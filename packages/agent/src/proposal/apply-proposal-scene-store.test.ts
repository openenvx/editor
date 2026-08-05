import { SceneStore } from '@openenvx/core';
import type { WorkbenchApi } from '@openenvx/headless';
import { SCHEMA_VERSION } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

import { applyProposedChanges } from './apply-proposal';

function createStore() {
  return new SceneStore(
    {
      schemaVersion: SCHEMA_VERSION,
      pages: [
        {
          id: 'p1',
          name: 'Page',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [
            {
              id: 't1',
              type: 'canvas.text',
              data: { html: '<p>Hi</p>', align: 'left', fill: '#000000' },
              transform: {
                x: 10,
                y: 10,
                width: 200,
                height: 40,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
              },
            },
          ],
        },
      ],
    },
    { activePageId: 'p1', primaryLayerId: null, selectedLayerIds: [] }
  );
}

function apiFor(store: SceneStore): WorkbenchApi {
  return {
    scene: store,
    selectLayers: (layerIds, primary) => store.selectLayers(layerIds, primary),
    runCommand: async () => ({ executed: false }),
  } as unknown as WorkbenchApi;
}

describe('applyProposedChanges against SceneStore', () => {
  it('applies valid property updates even when another change is schema-invalid', async () => {
    const store = createStore();

    const result = await applyProposedChanges(apiFor(store), [
      {
        kind: 'updateProperty',
        layerId: 't1',
        key: 'align',
        value: 'center',
      },
      {
        kind: 'updateProperty',
        layerId: 't1',
        key: 'align',
        value: 'justify',
      },
      {
        kind: 'updateProperty',
        layerId: 't1',
        key: 'fill',
        value: '#ff0000',
      },
    ]);

    expect(result.applied).toBeGreaterThanOrEqual(2);
    expect(result.skipped).toBeGreaterThanOrEqual(1);
    const data = store.getScene().pages[0]!.layers[0]!.data as {
      align?: string;
      fill?: string;
    };
    expect(data.align).toBe('center');
    expect(data.fill).toBe('#ff0000');
  });

  it('skips invalid creates without blocking valid ones', async () => {
    const store = createStore();

    const result = await applyProposedChanges(apiFor(store), [
      {
        kind: 'createLayer',
        type: 'canvas.image',
        data: {},
        label: 'broken image',
      },
      {
        kind: 'createLayer',
        type: 'canvas.text',
        data: { html: '<p>New</p>' },
        label: 'ok text',
      },
    ]);

    expect(result.applied).toBe(1);
    expect(result.skipped).toBe(1);
    expect(store.getScene().pages[0]!.layers).toHaveLength(2);
    expect(store.getScene().pages[0]!.layers[1]!.type).toBe('canvas.text');
  });

  it('applies canvas.svg and canvas.image with HTTPS assetRef', async () => {
    const store = createStore();

    const result = await applyProposedChanges(apiFor(store), [
      {
        kind: 'createLayer',
        type: 'canvas.svg',
        id: 'svg-1',
        data: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
          fill: '#111',
        },
      },
      {
        kind: 'createLayer',
        type: 'canvas.image',
        id: 'img-1',
        data: {
          assetRef: 'http://localhost:8789/assets/gen/abc.png',
          alt: 'generated',
        },
      },
    ]);

    expect(result).toEqual({ applied: 2, skipped: 0 });
    const layers = store.getScene().pages[0]!.layers;
    expect(layers).toHaveLength(3);
    expect(layers.find((layer) => layer.id === 'svg-1')).toMatchObject({
      type: 'canvas.svg',
    });
    expect(layers.find((layer) => layer.id === 'img-1')).toMatchObject({
      type: 'canvas.image',
      data: { assetRef: 'http://localhost:8789/assets/gen/abc.png' },
    });
  });
});
