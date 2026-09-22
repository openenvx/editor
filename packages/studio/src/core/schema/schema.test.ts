import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createEmptyScene,
  createEmptyProjectSnapshot,
  normalizeEditorState,
  normalizeScene,
  normalizeProjectSnapshot,
  validateScene,
} from './index';
import type { Document } from './types';

function flowArtboard(
  id: string,
  overrides: Partial<Document['artboards'][0]> = {}
) {
  return {
    extensions: { layout: 'flow' as const },
    id,
    name: 'Test',
    nodes: [],
    physical: { dpi: 96, unit: 'px' as const },
    space: {},
    ...overrides,
  };
}

describe('schema', () => {
  it('creates empty scene without editor state', () => {
    const scene = createEmptyScene();
    expect(scene.artboards).toHaveLength(1);
    expect(scene.artboards[0]!.extensions?.layout).toBe('flow');
    expect('selection' in scene).toBe(false);
    expect('activeArtboardId' in scene).toBe(false);
    expect(validateScene(scene).valid).toBeTruthy();
  });

  it('normalizes partial scene', () => {
    const scene = normalizeScene({
      artboards: [flowArtboard('p1', { name: 'Test' })],
    });
    expect(scene.artboards[0]!.id).toBe('p1');
  });

  it('rejects unknown keys in canonical mode', () => {
    const scene = createEmptyScene();
    const result = validateScene(
      { ...scene, unexpected: true },
      { mode: 'canonical' }
    );
    expect(result.valid).toBe(false);
  });

  it('accepts nested group children', () => {
    const scene = normalizeScene({
      artboards: [
        {
          extensions: { layout: 'absolute' },
          id: 'p1',
          name: 'Page',
          nodes: [
            {
              children: [
                {
                  id: 'child-1',
                  props: { fill: '#000' },
                  type: 'canvas.rect',
                },
              ],
              id: 'group-1',
              type: 'canvas.group',
            },
          ],
          physical: { dpi: 96, unit: 'px' },
          space: { height: 600, width: 800 },
        },
      ],
    });

    expect(validateScene(scene).valid).toBe(true);
  });

  it('accepts openenvx.widget with values and children', () => {
    const scene = normalizeScene({
      artboards: [
        {
          extensions: { layout: 'absolute' },
          id: 'p1',
          name: 'Page',
          nodes: [
            {
              children: [
                {
                  id: 'w1-0',
                  props: { fontSize: 24, html: 'Plan' },
                  showInLayers: false,
                  type: 'canvas.text',
                  writeMode: 'locked',
                },
              ],
              id: 'w1',
              props: {
                extensionId: 'wm.guest-tables',
                manifest: {
                  fields: { heading: { kind: 'text', label: 'Naglowek' } },
                  id: 'wm.guest-tables',
                  kinds: ['canvas'],
                  label: 'Plan stolow',
                },
                values: { heading: 'Plan' },
              },
              type: 'openenvx.widget',
            },
          ],
          physical: { dpi: 96, unit: 'px' },
          space: { height: 600, width: 800 },
        },
      ],
    });

    expect(validateScene(scene).valid).toBe(true);
    const layer = scene.artboards[0]!.nodes[0]!;
    expect(layer.type).toBe('openenvx.widget');
  });

  it('normalizes legacy embedded selection into snapshot', () => {
    const snapshot = normalizeProjectSnapshot({
      document: { artboards: [flowArtboard('p1', { name: 'Test' })] },
      session: {
        activeArtboardId: 'p1',
        primaryNodeId: null,
        selectedNodeIds: [],
      },
    });
    expect(snapshot.document.artboards[0]!.id).toBe('p1');
    expect(snapshot.session.activeArtboardId).toBe('p1');
  });

  it('creates empty snapshot', () => {
    const snapshot = createEmptyProjectSnapshot();
    expect(snapshot.session.activeArtboardId).toBe(
      snapshot.document.artboards[0]!.id
    );
  });

  it('normalizes editor state', () => {
    const state = normalizeEditorState({}, 'page-1');
    expect(state.activeArtboardId).toBe('page-1');
    expect(state.selectedNodeIds).toEqual([]);
  });

  it('is idempotent for normalizeScene', () => {
    const once = normalizeScene({
      artboards: [flowArtboard('p1', { name: 'Test' })],
    });
    const twice = normalizeScene(once);
    expect(twice).toEqual(once);
  });

  it('round-trips through JSON Schema export shape', async () => {
    const { readFileSync } = await import('node:fs');
    const json = JSON.parse(
      readFileSync(
        path.join(import.meta.dirname, '../../../scene.schema.json'),
        'utf-8'
      )
    ) as { $schema?: string; type?: string };
    expect(json.$schema).toContain('2020-12');
    expect(json.type).toBe('object');
  });

  it('accepts opaque node props on the document model', () => {
    const result = validateScene({
      artboards: [
        flowArtboard('p1', {
          nodes: [
            {
              id: 'rect-1',
              props: { fill: 123 },
              type: 'canvas.rect',
            },
            { id: 'img-1', props: {}, type: 'canvas.image' },
          ],
        }),
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts canvas.svg with svg markup', () => {
    const result = validateScene({
      artboards: [
        {
          extensions: { layout: 'flow' },
          id: 'p1',
          name: 'Page',
          nodes: [
            {
              id: 'svg-1',
              props: {
                fill: '#111',
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
              },
              type: 'canvas.svg',
            },
          ],
          physical: { dpi: 96, unit: 'px' },
          space: {},
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts canvas.svg with empty props bag', () => {
    const result = validateScene({
      artboards: [
        flowArtboard('p1', {
          nodes: [{ id: 'svg-1', props: {}, type: 'canvas.svg' }],
        }),
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts canvas.qr with url payload', () => {
    const result = validateScene({
      artboards: [
        {
          extensions: { layout: 'absolute' },
          id: 'p1',
          name: 'Page',
          nodes: [
            {
              id: 'qr-1',
              name: 'qr',
              props: {
                foreground: '#000',
                url: 'https://example.com',
              },
              type: 'canvas.qr',
            },
          ],
          physical: { dpi: 96, unit: 'px' },
          space: {},
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts canvas.qr with empty props bag', () => {
    const result = validateScene({
      artboards: [
        flowArtboard('p1', {
          extensions: { layout: 'absolute' },
          nodes: [{ id: 'qr-1', props: {}, type: 'canvas.qr' }],
        }),
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('throws when normalizeScene cannot parse input', () => {
    expect(() =>
      normalizeScene({
        artboards: [
          {
            extensions: { layout: 'flow' },
            id: 'p1',
            name: 'Page',
            nodes: [{ id: 'broken' }],
            physical: { dpi: 96, unit: 'px' },
            space: {},
          },
        ],
      })
    ).toThrow(/Failed to normalize OpenEnvx document/);
  });

  it('prunes stale selection ids against scene', () => {
    const scene = normalizeScene({
      artboards: [flowArtboard('p1', { name: 'Page' })],
    });
    const state = normalizeEditorState(
      {
        activeArtboardId: 'p1',
        primaryNodeId: 'missing',
        selectedNodeIds: ['missing', 'also-missing'],
      },
      'p1',
      scene
    );
    expect(state.selectedNodeIds).toEqual([]);
    expect(state.primaryNodeId).toBeNull();
  });

  it('reads top-level editorState in legacy snapshot shape', () => {
    const snapshot = normalizeProjectSnapshot({
      editorState: {
        activeArtboardId: 'p1',
        primaryNodeId: null,
        selectedNodeIds: ['layer-a'],
      },
      scene: {
        artboards: [
          {
            extensions: { layout: 'flow' },
            id: 'p1',
            name: 'Page',
            nodes: [
              {
                id: 'layer-a',
                props: { fill: '#000' },
                type: 'canvas.rect',
              },
            ],
            physical: { dpi: 96, unit: 'px' },
            space: {},
          },
        ],
      },
    });
    expect(snapshot.session.selectedNodeIds).toEqual(['layer-a']);
  });

  it('rejects empty artboards array in validation', () => {
    const result = validateScene({
      artboards: [],
      schemaVersion: 4,
    });
    expect(result.valid).toBe(false);
  });
});
