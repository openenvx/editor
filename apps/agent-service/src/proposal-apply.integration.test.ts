import { applyProposedChanges } from '@openenvx/agent';
import {
  proposedChangesPayloadSchema,
  type ProposedChange,
} from '@openenvx/agent/schemas';
import { SceneStore } from '@openenvx/core';
import { SCHEMA_VERSION } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import { getProposalStore } from './request-context';
import { createProposalTools } from './tools/proposal-tools';

type ApplyApi = Parameters<typeof applyProposedChanges>[0];

/**
 * Mirrors apps/agent-service/src/routes/chat-route.ts after stream finish:
 * flush the request-scoped proposal store as a UI data part.
 */
function buildProposedChangesStreamPart(proposedChanges: ProposedChange[]): {
  type: 'data-proposed-changes';
  data: { changes: ProposedChange[]; summary: string };
} | null {
  if (proposedChanges.length === 0) {
    return null;
  }
  return {
    type: 'data-proposed-changes',
    data: {
      changes: proposedChanges,
      summary: `${proposedChanges.length} proposed change(s)`,
    },
  };
}

function createStore(options?: { activePageId?: string; twoPages?: boolean }) {
  const pages = [
    {
      id: 'p1',
      name: 'Page 1',
      layout: 'absolute' as const,
      width: 800,
      height: 600,
      layers: [
        {
          id: 't1',
          type: 'canvas.text' as const,
          data: { html: '<p>Hi</p>', align: 'left' as const, fill: '#000000' },
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
  ];

  if (options?.twoPages) {
    pages.push({
      id: 'p2',
      name: 'Page 2',
      layout: 'absolute',
      width: 800,
      height: 600,
      layers: [],
    });
  }

  return new SceneStore(
    { schemaVersion: SCHEMA_VERSION, pages },
    {
      activePageId: options?.activePageId ?? 'p1',
      primaryLayerId: null,
      selectedLayerIds: [],
    }
  );
}

function apiFor(store: SceneStore): ApplyApi {
  return {
    scene: store,
    selectLayers: (layerIds: string[], primary?: string | null) =>
      store.selectLayers(layerIds, primary),
    runCommand: async () => ({ executed: false }),
  } as unknown as ApplyApi;
}

describe('proposal tools → store → apply → SceneStore', () => {
  it('creates a text layer and updates a property on the active page', async () => {
    const requestToken = {};
    const tools = createProposalTools(requestToken);
    const store = createStore();

    await tools.proposeCreateLayer.execute!(
      {
        type: 'canvas.text',
        id: 'new-text',
        data: { html: '<p>New</p>' },
        label: 'Create text',
      },
      {} as never
    );
    await tools.proposeUpdateProperty.execute!(
      {
        layerId: 't1',
        key: 'align',
        value: 'center',
        label: 'Center title',
      },
      {} as never
    );

    const proposedChanges = getProposalStore(requestToken);
    expect(proposedChanges).toHaveLength(2);

    const streamPart = buildProposedChangesStreamPart(proposedChanges);
    expect(streamPart).not.toBeNull();
    expect(streamPart!.type).toBe('data-proposed-changes');
    const parsed = proposedChangesPayloadSchema.safeParse(streamPart!.data);
    expect(parsed.success).toBe(true);

    const result = await applyProposedChanges(
      apiFor(store),
      parsed.data!.changes,
      parsed.data!.summary
    );

    expect(result.applied).toBe(2);
    expect(result.skipped).toBe(0);

    const page = store.getScene().pages[0]!;
    expect(page.layers).toHaveLength(2);
    expect(page.layers[1]).toMatchObject({
      id: 'new-text',
      type: 'canvas.text',
      data: { html: '<p>New</p>' },
    });
    expect(
      (page.layers[0]!.data as { align?: string }).align
    ).toBe('center');
  });

  it('applies valid updates when the store also holds a schema-invalid change', async () => {
    const requestToken = {};
    const tools = createProposalTools(requestToken);
    const store = createStore();

    await tools.proposeUpdateProperty.execute!(
      { layerId: 't1', key: 'align', value: 'center' },
      {} as never
    );
    await tools.proposeUpdateProperty.execute!(
      { layerId: 't1', key: 'align', value: 'justify' },
      {} as never
    );
    await tools.proposeUpdateProperty.execute!(
      { layerId: 't1', key: 'fill', value: '#ff0000' },
      {} as never
    );

    const proposedChanges = getProposalStore(requestToken);
    const streamPart = buildProposedChangesStreamPart(proposedChanges);
    const parsed = proposedChangesPayloadSchema.parse(streamPart!.data);

    const result = await applyProposedChanges(
      apiFor(store),
      parsed.changes,
      parsed.summary
    );

    expect(result.applied).toBeGreaterThanOrEqual(2);
    expect(result.skipped).toBeGreaterThanOrEqual(1);

    const data = store.getScene().pages[0]!.layers[0]!.data as {
      align?: string;
      fill?: string;
    };
    expect(data.align).toBe('center');
    expect(data.fill).toBe('#ff0000');
  });

  it('creates on the active page only when multiple pages exist', async () => {
    const requestToken = {};
    const tools = createProposalTools(requestToken);
    const store = createStore({ twoPages: true, activePageId: 'p2' });

    await tools.proposeCreateLayer.execute!(
      {
        type: 'canvas.rect',
        id: 'rect-p2',
        data: { fill: '#3b82f6' },
      },
      {} as never
    );

    const proposedChanges = getProposalStore(requestToken);
    const streamPart = buildProposedChangesStreamPart(proposedChanges);
    const parsed = proposedChangesPayloadSchema.parse(streamPart!.data);

    const result = await applyProposedChanges(
      apiFor(store),
      parsed.changes,
      parsed.summary
    );

    expect(result).toEqual({ applied: 1, skipped: 0 });
    expect(store.getScene().pages[0]!.layers).toHaveLength(1);
    expect(store.getScene().pages[1]!.layers).toHaveLength(1);
    expect(store.getScene().pages[1]!.layers[0]).toMatchObject({
      id: 'rect-p2',
      type: 'canvas.rect',
    });
  });

  it('deletes layers proposed via propose-delete-layer', async () => {
    const requestToken = {};
    const tools = createProposalTools(requestToken);
    const store = createStore();

    await tools.proposeDeleteLayer.execute!(
      { layerIds: ['t1'] },
      {} as never
    );

    const proposedChanges = getProposalStore(requestToken);
    const streamPart = buildProposedChangesStreamPart(proposedChanges);
    const parsed = proposedChangesPayloadSchema.parse(streamPart!.data);

    const result = await applyProposedChanges(
      apiFor(store),
      parsed.changes,
      parsed.summary
    );

    expect(result).toEqual({ applied: 1, skipped: 0 });
    expect(store.getScene().pages[0]!.layers).toHaveLength(0);
  });
});

describe('chat-route proposal flush contract', () => {
  it('emits a schema-valid data-proposed-changes part after tools fill the store', async () => {
    const requestToken = {};
    const tools = createProposalTools(requestToken);

    await tools.proposeChanges.execute!(
      {
        summary: 'Batch',
        changes: [
          {
            kind: 'createLayer',
            type: 'canvas.text',
            id: 'batch-text',
            data: { html: '<p>Batch</p>' },
          },
        ],
      },
      {} as never
    );

    const part = buildProposedChangesStreamPart(getProposalStore(requestToken));
    expect(part).toEqual({
      type: 'data-proposed-changes',
      data: {
        changes: [
          expect.objectContaining({
            kind: 'createLayer',
            type: 'canvas.text',
            id: 'batch-text',
          }),
        ],
        summary: '1 proposed change(s)',
      },
    });
    expect(proposedChangesPayloadSchema.safeParse(part!.data).success).toBe(
      true
    );
  });

  it('emits nothing when the proposal store is empty', () => {
    const requestToken = {};
    // Touch the store so WeakMap entry exists but stays empty.
    getProposalStore(requestToken);
    expect(buildProposedChangesStreamPart(getProposalStore(requestToken))).toBe(
      null
    );
  });
});
