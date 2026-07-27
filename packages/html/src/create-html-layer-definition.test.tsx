import { normalizeScene } from '@openenvx/schema';
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
          kind: 'select',
          label: 'Direction',
          options: [{ label: 'Row', value: 'row' }],
        },
        html: { kind: 'textarea', label: 'HTML' },
        name: { kind: 'text', label: 'Name' },
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
      'html',
      'name',
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
