import { normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import type { BlockConfig, FieldDef } from './block-config';
import { createHtmlLayerDefinition } from './create-html-layer-definition';

function configWithFields(
  type: string,
  fields: Record<string, FieldDef>,
  defaultData: Record<string, unknown> = {}
): BlockConfig {
  return {
    type,
    label: type,
    fields,
    defaultData,
    render: () => <div />,
  };
}

describe('createHtmlLayerDefinition', () => {
  it('clones defaults and round-trips serialize/deserialize', () => {
    const defaults = { html: 'Hi', level: '2' };
    const def = createHtmlLayerDefinition(
      configWithFields('html.heading', {}, defaults)
    );
    const page = normalizeScene({
      pages: [{ id: 'p1', name: 'Page', layout: 'html', layers: [] }],
    }).pages[0]!;

    const layer = def.createDefault('h1', page);
    expect(layer).toEqual({
      data: defaults,
      id: 'h1',
      type: 'html.heading',
    });
    layer.data = { html: 'mutated' };
    expect(def.createDefault('h2', page).data).toEqual(defaults);

    expect(def.serialize(layer)).toEqual({ html: 'mutated' });
    expect(def.deserialize({ html: 'from-disk' })).toEqual({
      html: 'from-disk',
    });
    expect(def.deserialize('not-an-object')).toEqual(defaults);
  });

  it('builds properties for each field kind and empty fields', () => {
    const withFields = createHtmlLayerDefinition(
      configWithFields('html.flex', {
        gap: { kind: 'number', label: 'Gap' },
        direction: {
          kind: 'segmented',
          label: 'Direction',
          options: [{ label: 'Row', value: 'row' }],
        },
        layout: {
          kind: 'segmented',
          label: 'Layout',
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
        html: { kind: 'richText', label: 'HTML' },
        name: { kind: 'text', label: 'Name' },
        tint: { kind: 'color', label: 'Tint' },
        photo: { kind: 'image', label: 'Photo' },
        align: { kind: 'align', label: 'Align' },
        show: { kind: 'toggle', label: 'Show' },
      })
    );
    const sections = withFields.properties(
      {} as never,
      { id: 'x', type: 'html.flex', data: {} }
    );
    expect(sections).toHaveLength(1);
    expect(sections[0]!.fields.map((f) => f.key)).toEqual([
      'gap',
      'direction',
      'layout',
      'html',
      'name',
      'tint',
      'photo',
      'align',
      'show',
    ]);
    expect(sections[0]!.fields.map((f) => f.kind)).toEqual([
      'number',
      'segmented',
      'segmented',
      'richText',
      'text',
      'color',
      'image',
      'align',
      'toggle',
    ]);

    const empty = createHtmlLayerDefinition(
      configWithFields('html.custom', {})
    );
    expect(empty.properties({} as never, { id: 'y', type: 'html.custom' })).toEqual(
      []
    );
  });

  it('picks tree icons and preview labels', () => {
    const cases: [string, string][] = [
      ['html.heading', 'text'],
      ['html.text', 'text'],
      ['html.image', 'image'],
      ['html.button', 'box'],
      ['html.root', 'file'],
      ['html.flex', 'box'],
      ['html.grid', 'box'],
      ['html.container', 'box'],
      ['html.unknown', 'box'],
    ];
    for (const [type, icon] of cases) {
      expect(createHtmlLayerDefinition(configWithFields(type, {})).treeIcon).toBe(
        icon
      );
    }
    expect(
      createHtmlLayerDefinition({
        ...configWithFields('html.hero', {}),
        treeIcon: 'image',
      }).treeIcon
    ).toBe('image');

    const textDef = createHtmlLayerDefinition(
      configWithFields('html.heading', {}, { html: 'Heading' })
    );
    const withHtml = textDef.renderPreview({
      isSelected: false,
      layerId: 'a',
      model: { html: '<p>Hello <b>world</b></p>' },
    });
    expect(withHtml.kind).toBe('placeholder');
    if (withHtml.kind === 'placeholder') {
      expect(withHtml.text).toBe('Hello world');
    }

    const imageDef = createHtmlLayerDefinition(
      configWithFields('html.image', {}, { alt: 'Alt text' })
    );
    const withAlt = imageDef.renderPreview({
      isSelected: false,
      layerId: 'b',
      model: { alt: 'Photo' },
    });
    if (withAlt.kind === 'placeholder') {
      expect(withAlt.text).toBe('Photo');
    }

    const fallback = imageDef.renderPreview({
      isSelected: false,
      layerId: 'c',
      model: {},
    });
    if (fallback.kind === 'placeholder') {
      expect(fallback.text).toBe('html.image');
    }
  });
});
