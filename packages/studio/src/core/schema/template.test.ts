import { describe, expect, it } from 'vitest';

import { normalizeScene } from './normalize';
import {
  applyModifications,
  extractTemplateManifest,
  findTemplateLayerByName,
  plainTextToHtml,
  validateTemplateNames,
} from './template';

function sampleScene() {
  return normalizeScene({
    artboards: [
      {
        extensions: { layout: 'absolute' },
        id: 'p1',
        name: 'Page',
        nodes: [
          {
            id: 't1',
            name: 'headline',
            props: { fill: '#111', fontSize: 24, html: '<p>Hello</p>' },
            type: 'canvas.text',
          },
          {
            id: 'i1',
            name: 'hero',
            props: { assetRef: 'https://example.com/a.png', fit: 'cover' },
            type: 'canvas.image',
          },
          {
            id: 'r1',
            name: 'accent',
            props: { fill: '#3b82f6' },
            type: 'canvas.rect',
          },
          {
            id: 'q1',
            name: 'qr',
            props: {
              background: '#ffffff',
              foreground: '#000000',
              url: 'https://example.com/demo',
            },
            type: 'canvas.qr',
          },
          {
            children: [
              {
                id: 't2',
                name: 'subtitle',
                props: { html: '<p>Nested</p>' },
                type: 'canvas.text',
              },
            ],
            id: 'g1',
            type: 'canvas.group',
          },
        ],
        space: { height: 600, width: 800 },
      },
    ],
  });
}

describe('template', () => {
  it('plainTextToHtml escapes and wraps', () => {
    expect(plainTextToHtml('A <B> & "c"')).toBe(
      '<p>A &lt;B&gt; &amp; &quot;c&quot;</p>'
    );
  });

  it('extractTemplateManifest lists named text/image/color layers', () => {
    const manifest = extractTemplateManifest(sampleScene());
    expect(manifest.fields.map((f) => f.name).toSorted()).toEqual([
      'accent',
      'headline',
      'hero',
      'qr',
      'subtitle',
    ]);
    expect(manifest.fields.find((f) => f.name === 'headline')?.kind).toBe(
      'text'
    );
    expect(manifest.fields.find((f) => f.name === 'qr')?.kind).toBe('qr');
    expect(manifest.fields.find((f) => f.name === 'qr')?.sample).toBe(
      'https://example.com/demo'
    );
    expect(manifest.fields.find((f) => f.name === 'hero')?.kind).toBe('image');
    expect(manifest.fields.find((f) => f.name === 'accent')?.kind).toBe(
      'color'
    );
    expect(manifest.fields.find((f) => f.name === 'headline')?.sample).toBe(
      'Hello'
    );
  });

  it('validateTemplateNames reports duplicates', () => {
    const scene = normalizeScene({
      artboards: [
        {
          extensions: { layout: 'absolute' },
          id: 'p1',
          name: 'Page',
          nodes: [
            {
              id: 't1',
              name: 'title',
              props: { html: '<p>A</p>' },
              type: 'canvas.text',
            },
            {
              id: 't2',
              name: 'title',
              props: { html: '<p>B</p>' },
              type: 'canvas.text',
            },
          ],
          space: {},
        },
      ],
    });
    expect(validateTemplateNames(scene).duplicates).toEqual(['title']);
    expect(validateTemplateNames(sampleScene()).duplicates).toEqual([]);
  });

  it('applyModifications updates text, image, color, font, and visibility', () => {
    const resolved = applyModifications(sampleScene(), [
      {
        fontFamily: 'Inter',
        fontSize: 18,
        name: 'headline',
        text: 'World',
      },
      { imageUrl: 'https://cdn.example/b.png', name: 'hero' },
      { color: '#ff0000', name: 'accent' },
      { hidden: true, name: 'subtitle' },
      {
        color: '#1d4ed8',
        name: 'qr',
        text: 'https://weselnemomenty.pl/e/abc',
      },
    ]);

    const headline = findTemplateLayerByName(resolved, 'headline');
    expect(headline?.type).toBe('canvas.text');
    expect(headline?.props).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 18,
      html: '<p>World</p>',
    });

    const hero = findTemplateLayerByName(resolved, 'hero');
    expect(hero?.type).toBe('canvas.image');
    expect(hero?.props).toMatchObject({
      assetRef: 'https://cdn.example/b.png',
    });

    const accent = findTemplateLayerByName(resolved, 'accent');
    expect(accent?.type).toBe('canvas.rect');
    expect(accent?.props).toMatchObject({ fill: '#ff0000' });

    const subtitle = findTemplateLayerByName(resolved, 'subtitle');
    expect(subtitle?.visible).toBe(false);

    const qr = findTemplateLayerByName(resolved, 'qr');
    expect(qr?.type).toBe('canvas.qr');
    expect(qr?.props).toMatchObject({
      foreground: '#1d4ed8',
      url: 'https://weselnemomenty.pl/e/abc',
    });
  });

  it('applyModifications does not mutate the source scene', () => {
    const scene = sampleScene();
    const before = structuredClone(scene);
    applyModifications(scene, [{ name: 'headline', text: 'Changed' }]);
    expect(scene).toEqual(before);
  });

  it('applyModifications skips unknown names', () => {
    const scene = sampleScene();
    const resolved = applyModifications(scene, [
      { name: 'missing', text: 'Nope' },
    ]);
    expect(findTemplateLayerByName(resolved, 'headline')?.type).toBe(
      'canvas.text'
    );
  });
});
