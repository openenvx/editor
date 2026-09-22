import { formatVariableToken, nodeTransform } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { resolveCanvasExportScene } from './resolve-canvas-export-scene';
import {
  legacyLayer,
  testArtboard,
  testDocument,
} from '../test/canvas-document-fixtures';

describe('resolveCanvasExportScene', () => {
  it('substitutes known variable keys', () => {
    const token = formatVariableToken('name');
    const scene = testDocument([
      testArtboard({
        id: 'page-1',
        nodes: [
          legacyLayer({
            data: {
              align: 'center',
              html: `<p>Hello ${token}</p>`,
            },
            id: 'text-1',
            transform: {
              height: 80,
              opacity: 1,
              rotation: 0,
              width: 700,
              x: 48,
              y: 100,
            },
            type: 'canvas.text',
          }),
        ],
      }),
    ]);
    const resolved = resolveCanvasExportScene(scene, {
      variables: { name: 'Ada' },
    });
    const layer = resolved.artboards[0]!.nodes[0]!;
    expect((layer.props as { html: string }).html).toBe('<p>Hello Ada</p>');
    expect(nodeTransform(layer).x).toBe(48);
    expect(nodeTransform(layer).width).toBe(700);
  });

  it('leaves unknown tokens when key is missing from values', () => {
    const known = formatVariableToken('name');
    const unknown = formatVariableToken('missing');
    const scene = testDocument([
      testArtboard({
        id: 'page-1',
        nodes: [
          legacyLayer({
            data: { html: `<p>${known} ${unknown}</p>` },
            id: 'text-1',
            transform: {
              height: 100,
              opacity: 1,
              rotation: 0,
              width: 400,
              x: 0,
              y: 0,
            },
            type: 'canvas.text',
          }),
        ],
      }),
    ]);
    const resolved = resolveCanvasExportScene(scene, {
      variables: { name: 'Ada' },
    });
    const html = (resolved.artboards[0]!.nodes[0]!.props as { html: string })
      .html;
    expect(html).toContain('Ada');
    expect(html).toContain(unknown);
  });

  it('hugs width after variable substitution', () => {
    const token = formatVariableToken('title');
    const scene = testDocument([
      testArtboard({
        id: 'page-1',
        nodes: [
          legacyLayer({
            data: {
              align: 'center',
              autoFit: 'hug',
              html: `<p>${token}</p>`,
            },
            id: 't1',
            transform: {
              height: 64,
              opacity: 1,
              rotation: 0,
              width: 500,
              x: 150,
              y: 200,
            },
            type: 'canvas.text',
          }),
        ],
      }),
    ]);
    const resolved = resolveCanvasExportScene(scene, {
      variables: { title: 'Engineer' },
    });
    const layer = resolved.artboards[0]!.nodes[0]!;
    expect(nodeTransform(layer).x).toBe(150);
    expect(nodeTransform(layer).width).toBeLessThan(500);
  });
});
