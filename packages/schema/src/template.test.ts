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
    pages: [
      {
        height: 600,
        id: 'p1',
        layers: [
          {
            data: { html: '<p>Hello</p>', fontSize: 24, fill: '#111' },
            id: 't1',
            name: 'headline',
            type: 'canvas.text',
          },
          {
            data: { assetRef: 'https://example.com/a.png', fit: 'cover' },
            id: 'i1',
            name: 'hero',
            type: 'canvas.image',
          },
          {
            data: { fill: '#3b82f6' },
            id: 'r1',
            name: 'accent',
            type: 'canvas.rect',
          },
          {
            data: {
              children: [
                {
                  data: { html: '<p>Nested</p>' },
                  id: 't2',
                  name: 'subtitle',
                  type: 'canvas.text',
                },
              ],
            },
            id: 'g1',
            type: 'canvas.group',
          },
        ],
        layout: 'absolute',
        name: 'Page',
        width: 800,
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
      'subtitle',
    ]);
    expect(manifest.fields.find((f) => f.name === 'headline')?.kind).toBe(
      'text'
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
      pages: [
        {
          id: 'p1',
          layers: [
            {
              data: { html: '<p>A</p>' },
              id: 't1',
              name: 'title',
              type: 'canvas.text',
            },
            {
              data: { html: '<p>B</p>' },
              id: 't2',
              name: 'title',
              type: 'canvas.text',
            },
          ],
          layout: 'absolute',
          name: 'Page',
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
    ]);

    const headline = findTemplateLayerByName(resolved, 'headline');
    expect(headline?.type).toBe('canvas.text');
    if (headline?.type === 'canvas.text') {
      expect(headline.data.html).toBe('<p>World</p>');
      expect(headline.data.fontFamily).toBe('Inter');
      expect(headline.data.fontSize).toBe(18);
    }

    const hero = findTemplateLayerByName(resolved, 'hero');
    expect(hero?.type).toBe('canvas.image');
    if (hero?.type === 'canvas.image') {
      expect(hero.data.assetRef).toBe('https://cdn.example/b.png');
    }

    const accent = findTemplateLayerByName(resolved, 'accent');
    expect(accent?.type).toBe('canvas.rect');
    if (accent?.type === 'canvas.rect') {
      expect(accent.data.fill).toBe('#ff0000');
    }

    const subtitle = findTemplateLayerByName(resolved, 'subtitle');
    expect(subtitle?.visible).toBe(false);
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
