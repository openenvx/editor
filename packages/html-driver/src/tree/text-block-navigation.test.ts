import { describe, expect, it } from 'vitest';

import type { Layer } from '@openenvx/studio/schema';

import type { BlockConfig } from '../block-config';
import { BlockRegistry } from '../block-registry';
import {
  findAdjacentTextBlockId,
  isRichTextBlock,
} from './text-block-navigation';

function stub(
  type: string,
  options?: { richText?: boolean; acceptsChildren?: boolean }
): BlockConfig {
  return {
    type,
    label: type,
    fields: options?.richText
      ? { html: { kind: 'richText', label: 'Text' } }
      : {},
    defaultData: {},
    acceptsChildren: options?.acceptsChildren,
    render: () => null as never,
  };
}

function layer(
  id: string,
  type: string,
  children: Layer[] = [],
  extra?: Partial<Layer>
): Layer {
  return {
    id,
    type,
    data: { children },
    ...extra,
  };
}

function registryWith(...configs: BlockConfig[]): BlockRegistry {
  const registry = new BlockRegistry();
  for (const config of configs) {
    registry.register(config);
  }
  return registry;
}

describe('text-block-navigation', () => {
  const registry = registryWith(
    stub('html.root', { acceptsChildren: true }),
    stub('html.section', { acceptsChildren: true }),
    stub('html.row', { acceptsChildren: true }),
    stub('html.column', { acceptsChildren: true }),
    stub('html.heading', { richText: true }),
    stub('html.text', { richText: true }),
    stub('html.image')
  );

  const layers: Layer[] = [
    layer('root', 'html.root', [
      layer('section', 'html.section', [
        layer('h1', 'html.heading'),
        layer('t1', 'html.text'),
        layer('img', 'html.image'),
        layer('row', 'html.row', [
          layer('col-a', 'html.column', [layer('t2', 'html.text')]),
          layer('col-b', 'html.column', [
            layer('t3', 'html.text', [], { locked: true }),
            layer('t4', 'html.text'),
          ]),
        ]),
      ]),
    ]),
  ];

  it('identifies rich-text block types from registry fields', () => {
    expect(isRichTextBlock(registry, 'html.text')).toBe(true);
    expect(isRichTextBlock(registry, 'html.heading')).toBe(true);
    expect(isRichTextBlock(registry, 'html.image')).toBe(false);
  });

  it('walks nested containers in document order and skips locked / non-text', () => {
    expect(findAdjacentTextBlockId(layers, registry, 'h1', 'prev')).toBeNull();
    expect(findAdjacentTextBlockId(layers, registry, 'h1', 'next')).toBe('t1');
    expect(findAdjacentTextBlockId(layers, registry, 't1', 'prev')).toBe('h1');
    expect(findAdjacentTextBlockId(layers, registry, 't1', 'next')).toBe('t2');
    expect(findAdjacentTextBlockId(layers, registry, 't2', 'next')).toBe('t4');
    expect(findAdjacentTextBlockId(layers, registry, 't2', 'prev')).toBe('t1');
    expect(findAdjacentTextBlockId(layers, registry, 't4', 'prev')).toBe('t2');
    expect(findAdjacentTextBlockId(layers, registry, 't4', 'next')).toBeNull();
  });

  it('returns null when the origin is not an editable text block', () => {
    expect(findAdjacentTextBlockId(layers, registry, 'img', 'next')).toBeNull();
    expect(findAdjacentTextBlockId(layers, registry, 't3', 'next')).toBeNull();
    expect(findAdjacentTextBlockId(layers, registry, 'missing', 'next')).toBeNull();
  });
});
