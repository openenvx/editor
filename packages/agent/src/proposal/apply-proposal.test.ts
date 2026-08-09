import { describe, expect, it, vi } from 'vitest';

import type { WorkbenchApi } from '@openenvx/core';

import { proposedChangeSchema } from '../schemas/proposed-changes';
import { applyProposedChanges } from './apply-proposal';

vi.mock('@openenvx/core', () => ({
  findLayerById: vi.fn(),
  updateLayerInTree: vi.fn(),
  insertLayerIntoContainer: vi.fn((layers, _containerId, child) => [
    ...layers,
    child,
  ]),
  removeLayerFromTree: vi.fn((layers) => layers),
  walkLayers: vi.fn((layers, visit) => {
    for (const layer of layers) {
      visit(layer);
    }
  }),
}));

vi.mock('@openenvx/core/schema', () => ({
  createDefaultTransform: () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  }),
  normalizeScene: (scene: unknown) => scene,
}));

describe('proposedChangeSchema', () => {
  it('accepts executeCommand changes', () => {
    const parsed = proposedChangeSchema.parse({
      kind: 'executeCommand',
      commandId: 'canvas.alignLeft',
    });
    expect(parsed.kind).toBe('executeCommand');
  });

  it('accepts createLayer and deleteLayer changes', () => {
    expect(
      proposedChangeSchema.parse({
        kind: 'createLayer',
        type: 'text',
        data: { html: '<p>Hello</p>' },
      }).kind
    ).toBe('createLayer');

    expect(
      proposedChangeSchema.parse({
        kind: 'deleteLayer',
        layerIds: ['a', 'b'],
      }).kind
    ).toBe('deleteLayer');
  });
});

describe('applyProposedChanges', () => {
  it('applies selectLayers before executeCommand so commands see the selection', async () => {
    const order: string[] = [];

    const api = {
      selectLayers: vi.fn((layerIds: string[]) => {
        order.push(`select:${layerIds.join(',')}`);
      }),
      scene: {
        apply: vi.fn(() => {
          order.push('scene.apply');
        }),
      },
      runCommand: vi.fn(async (commandId: string) => {
        order.push(`command:${commandId}`);
        return { executed: true };
      }),
    } as unknown as WorkbenchApi;

    const result = await applyProposedChanges(api, [
      {
        kind: 'selectLayers',
        layerIds: ['layer-a', 'layer-b'],
      },
      {
        kind: 'executeCommand',
        commandId: 'canvas.alignLeft',
      },
    ]);

    expect(result).toEqual({ applied: 2, skipped: 0 });
    expect(api.selectLayers).toHaveBeenCalledWith(
      ['layer-a', 'layer-b'],
      undefined
    );
    expect(api.runCommand).toHaveBeenCalledWith('canvas.alignLeft', undefined);
    expect(order).toEqual([
      'select:layer-a,layer-b',
      'command:canvas.alignLeft',
    ]);
  });

  it('batches updateProperty changes in a single scene.apply transaction', async () => {
    const { findLayerById, updateLayerInTree } = await import('@openenvx/core');
    vi.mocked(findLayerById).mockReturnValue({
      id: 'layer-a',
      type: 'canvas.rect',
      data: {},
    } as never);
    vi.mocked(updateLayerInTree).mockImplementation(
      (layers, _id, update) => layers.map((layer) => update(layer as never))
    );

    const api = {
      selectLayers: vi.fn(),
      scene: {
        apply: vi.fn(
          (transaction: {
            apply: (scene: {
              pages: { id: string; layers: { id: string; data: object }[] }[];
            }) => unknown;
          }) => {
            transaction.apply({
              pages: [
                {
                  id: 'page-1',
                  layers: [
                    { id: 'layer-a', data: {} },
                    { id: 'layer-b', data: {} },
                  ],
                },
              ],
            });
          }
        ),
      },
      runCommand: vi.fn(),
    } as unknown as WorkbenchApi;

    const result = await applyProposedChanges(api, [
      {
        kind: 'updateProperty',
        layerId: 'layer-a',
        key: 'fill',
        value: '#ff0000',
      },
      {
        kind: 'updateProperty',
        layerId: 'layer-b',
        key: 'opacity',
        value: 0.5,
      },
    ]);

    expect(result).toEqual({ applied: 2, skipped: 0 });
    expect(api.scene.apply).toHaveBeenCalledTimes(1);
    expect(api.selectLayers).not.toHaveBeenCalled();
    expect(api.runCommand).not.toHaveBeenCalled();
  });

  it('applies create before delete and uses scene.apply for both', async () => {
    const order: string[] = [];
    const api = {
      selectLayers: vi.fn(),
      scene: {
        apply: vi.fn(
          (transaction: {
            apply: (scene: {
              pages: { id: string; layers: unknown[] }[];
            }) => unknown;
          }) => {
            order.push('scene.apply');
            transaction.apply({
              pages: [{ id: 'page-1', layers: [] }],
            });
          }
        ),
        getActivePageId: () => 'page-1',
        getSelection: () => ({
          activePageId: 'page-1',
          primaryLayerId: null,
          selectedLayerIds: [],
        }),
        setSelection: vi.fn(),
      },
      runCommand: vi.fn(),
    } as unknown as WorkbenchApi;

    const result = await applyProposedChanges(api, [
      {
        kind: 'createLayer',
        type: 'text',
        id: 'new-text',
      },
      {
        kind: 'deleteLayer',
        layerIds: ['old-layer'],
      },
    ]);

    expect(result).toEqual({ applied: 2, skipped: 0 });
    expect(api.scene.apply).toHaveBeenCalledTimes(2);
    expect(order).toEqual(['scene.apply', 'scene.apply']);
  });

  it('normalizes bare text/rect types to canvas.* and textAlign to align', async () => {
    let createdLayer: { type: string; data: Record<string, unknown> } | null =
      null;

    const api = {
      selectLayers: vi.fn(),
      scene: {
        apply: vi.fn(
          (transaction: {
            apply: (scene: {
              pages: { id: string; layers: unknown[] }[];
            }) => {
              pages: {
                id: string;
                layers: { type: string; data: Record<string, unknown> }[];
              }[];
            };
          }) => {
            const next = transaction.apply({
              pages: [{ id: 'page-1', layers: [] }],
            });
            createdLayer = next.pages[0]!.layers.at(-1) ?? null;
          }
        ),
        getActivePageId: () => 'page-1',
        getSelection: () => ({
          activePageId: 'page-1',
          primaryLayerId: null,
          selectedLayerIds: [],
        }),
        setSelection: vi.fn(),
      },
      runCommand: vi.fn(),
    } as unknown as WorkbenchApi;

    await applyProposedChanges(api, [
      {
        kind: 'createLayer',
        type: 'text',
        data: {
          html: 'Hello',
          textAlign: 'center',
          fill: '#111',
        },
      },
    ]);

    expect(createdLayer).toMatchObject({
      type: 'canvas.text',
      data: {
        html: '<p>Hello</p>',
        align: 'center',
        fill: '#111',
      },
    });
    expect(createdLayer?.data.textAlign).toBeUndefined();
  });

  it('skips createLayer when parentId does not match a container', async () => {
    const { insertLayerIntoContainer } = await import('@openenvx/core');
    vi.mocked(insertLayerIntoContainer).mockImplementationOnce(
      (layers) => layers
    );

    const api = {
      selectLayers: vi.fn(),
      scene: {
        apply: vi.fn(
          (transaction: {
            apply: (scene: {
              pages: { id: string; layers: unknown[] }[];
            }) => unknown;
          }) => {
            transaction.apply({
              pages: [{ id: 'page-1', layers: [] }],
            });
          }
        ),
        getActivePageId: () => 'page-1',
        getSelection: () => ({
          activePageId: 'page-1',
          primaryLayerId: null,
          selectedLayerIds: [],
        }),
        setSelection: vi.fn(),
      },
      runCommand: vi.fn(),
    } as unknown as WorkbenchApi;

    const result = await applyProposedChanges(api, [
      {
        kind: 'createLayer',
        type: 'canvas.rect',
        parentId: 'missing-group',
      },
    ]);

    expect(result).toEqual({ applied: 0, skipped: 1 });
  });
});
