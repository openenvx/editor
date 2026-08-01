import { describe, expect, it } from 'vitest';

import {
  createEmptyScene,
  createEmptySceneSnapshot,
  normalizeEditorState,
  normalizeScene,
  normalizeSceneSnapshot,
  validateScene,
} from './index';

describe('schema', () => {
  it('creates empty scene without editor state', () => {
    const scene = createEmptyScene();
    expect(scene.pages).toHaveLength(1);
    expect(scene.pages[0]!.layout).toBe('flow');
    expect('selection' in scene).toBe(false);
    expect('activePageId' in scene).toBe(false);
    expect(validateScene(scene).valid).toBeTruthy();
  });

  it('normalizes partial scene', () => {
    const scene = normalizeScene({
      pages: [{ id: 'p1', layers: [], layout: 'flow', name: 'Test' }],
    });
    expect(scene.pages[0]!.id).toBe('p1');
    expect(scene.schemaVersion).toBeGreaterThanOrEqual(1);
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
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          name: 'Page',
          width: 800,
          height: 600,
          layers: [
            {
              data: {
                children: [
                  {
                    id: 'child-1',
                    type: 'canvas.rect',
                    data: { fill: '#000' },
                  },
                ],
              },
              id: 'group-1',
              type: 'canvas.group',
            },
          ],
        },
      ],
    });

    expect(validateScene(scene).valid).toBe(true);
  });

  it('normalizes legacy embedded selection into snapshot', () => {
    const snapshot = normalizeSceneSnapshot({
      activePageId: 'p1',
      pages: [{ id: 'p1', layers: [], layout: 'flow', name: 'Test' }],
      selection: {
        activePageId: 'p1',
        primaryLayerId: null,
        selectedLayerIds: [],
      },
    });
    expect(snapshot.scene.pages[0]!.id).toBe('p1');
    expect(snapshot.editorState.activePageId).toBe('p1');
  });

  it('creates empty snapshot', () => {
    const snapshot = createEmptySceneSnapshot();
    expect(snapshot.editorState.activePageId).toBe(snapshot.scene.pages[0]!.id);
  });

  it('normalizes editor state', () => {
    const state = normalizeEditorState({}, 'page-1');
    expect(state.activePageId).toBe('page-1');
    expect(state.selectedLayerIds).toEqual([]);
  });

  it('is idempotent for normalizeScene', () => {
    const once = normalizeScene({
      pages: [{ id: 'p1', layers: [], layout: 'flow', name: 'Test' }],
    });
    const twice = normalizeScene(once);
    expect(twice).toEqual(once);
  });

  it('round-trips through JSON Schema export shape', async () => {
    const { readFileSync } = await import('node:fs');
    const json = JSON.parse(
      readFileSync(new URL('../scene.schema.json', import.meta.url), 'utf-8')
    ) as { $schema?: string; type?: string };
    expect(json.$schema).toContain('2020-12');
    expect(json.type).toBe('object');
  });

  it('rejects invalid builtin layer data', () => {
    const result = validateScene({
      pages: [
        {
          id: 'p1',
          layout: 'flow',
          name: 'Page',
          layers: [
            {
              id: 'rect-1',
              type: 'canvas.rect',
              data: { fill: 123 },
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects canvas.image without assetRef', () => {
    const result = validateScene({
      pages: [
        {
          id: 'p1',
          layout: 'flow',
          name: 'Page',
          layers: [{ id: 'img-1', type: 'canvas.image', data: {} }],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('accepts canvas.svg with svg markup', () => {
    const result = validateScene({
      pages: [
        {
          id: 'p1',
          layout: 'flow',
          name: 'Page',
          layers: [
            {
              id: 'svg-1',
              type: 'canvas.svg',
              data: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
                fill: '#111',
              },
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects canvas.svg without svg', () => {
    const result = validateScene({
      pages: [
        {
          id: 'p1',
          layout: 'flow',
          name: 'Page',
          layers: [{ id: 'svg-1', type: 'canvas.svg', data: {} }],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('accepts canvas.qr with url payload', () => {
    const result = validateScene({
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          name: 'Page',
          layers: [
            {
              data: {
                foreground: '#000',
                url: 'https://example.com',
              },
              id: 'qr-1',
              name: 'qr',
              type: 'canvas.qr',
            },
          ],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects canvas.qr without url', () => {
    const result = validateScene({
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          name: 'Page',
          layers: [{ id: 'qr-1', type: 'canvas.qr', data: {} }],
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('throws when normalizeScene cannot parse input', () => {
    expect(() =>
      normalizeScene({
        pages: [
          {
            id: 'p1',
            layout: 'flow',
            name: 'Page',
            layers: [{ id: 'broken' }],
          },
        ],
      })
    ).toThrow(/Failed to normalize OpenEnvx scene/);
  });

  it('prunes stale selection ids against scene', () => {
    const scene = normalizeScene({
      pages: [{ id: 'p1', layout: 'flow', name: 'Page', layers: [] }],
    });
    const state = normalizeEditorState(
      {
        activePageId: 'p1',
        primaryLayerId: 'missing',
        selectedLayerIds: ['missing', 'also-missing'],
      },
      'p1',
      scene
    );
    expect(state.selectedLayerIds).toEqual([]);
    expect(state.primaryLayerId).toBeNull();
  });

  it('reads top-level editorState in legacy snapshot shape', () => {
    const snapshot = normalizeSceneSnapshot({
      activePageId: 'p1',
      editorState: {
        activePageId: 'p1',
        primaryLayerId: null,
        selectedLayerIds: ['layer-a'],
      },
      pages: [
        {
          id: 'p1',
          layout: 'flow',
          name: 'Page',
          layers: [{ id: 'layer-a', type: 'canvas.rect', data: { fill: '#000' } }],
        },
      ],
    });
    expect(snapshot.editorState.selectedLayerIds).toEqual(['layer-a']);
  });

  it('rejects empty pages array in validation', () => {
    const result = validateScene({
      pages: [],
      schemaVersion: 2,
    });
    expect(result.valid).toBe(false);
  });
});
