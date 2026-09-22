import type { Layer, Scene } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import type { BlockConfig } from '../block-config';
import { BlockRegistry } from '../block-registry';
import { legacyTestDocument, testHtmlBlock } from '../test/document-fixtures';
import {
  resolveRichTextToolbar,
  resolveSlotRichTextToolbar,
} from './rich-text-toolbar';

function stub(config: Partial<BlockConfig> & { type: string }): BlockConfig {
  return {
    label: config.type,
    fields: { html: { kind: 'richText', label: 'Text' } },
    defaultData: {},
    render: () => null as never,
    ...config,
  };
}

function registryOf(...configs: BlockConfig[]): BlockRegistry {
  const registry = new BlockRegistry();
  for (const config of configs) {
    registry.register(config);
  }
  return registry;
}

function layer(id: string, type: string, children?: Layer[]): Layer {
  if (children) {
    return testHtmlBlock(id, type, children, {});
  }
  return testHtmlBlock(id, type, undefined, { html: 'x' });
}

describe('resolveRichTextToolbar', () => {
  it('defaults to full toolbar', () => {
    const registry = registryOf(stub({ type: 'html.text' }));
    const scene: Scene = legacyTestDocument([
      {
        id: 'p',
        name: 'P',
        layout: 'html',
        width: 100,
        height: 100,
        layers: [layer('t', 'html.text')],
      },
    ]);
    expect(
      resolveRichTextToolbar(scene.artboards[0]!.nodes[0]!, scene, registry)
    ).toEqual({
      blockType: true,
      link: true,
      code: true,
      align: true,
    });
  });

  it('inherits childRichTextToolbar from ancestors and lets own config win', () => {
    const registry = registryOf(
      stub({
        type: 'snapvelo.eventHero',
        childRichTextToolbar: {
          blockType: false,
          link: false,
          code: false,
          align: false,
        },
      }),
      stub({ type: 'html.heading' }),
      stub({
        type: 'html.text',
        richTextToolbar: { align: true },
      })
    );
    const heading = layer('h', 'html.heading');
    const text = layer('t', 'html.text');
    const scene: Scene = legacyTestDocument([
      {
        id: 'p',
        name: 'P',
        layout: 'html',
        width: 100,
        height: 100,
        layers: [layer('hero', 'snapvelo.eventHero', [heading, text])],
      },
    ]);
    expect(resolveRichTextToolbar(heading, scene, registry)).toEqual({
      blockType: false,
      link: false,
      code: false,
      align: false,
    });
    expect(resolveRichTextToolbar(text, scene, registry)).toEqual({
      blockType: false,
      link: false,
      code: false,
      align: true,
    });
  });
});

describe('resolveSlotRichTextToolbar', () => {
  it('applies host childRichTextToolbar to slot parts', () => {
    const registry = registryOf(
      stub({
        type: 'html.hero',
        childRichTextToolbar: {
          blockType: false,
          link: false,
          code: false,
          align: false,
        },
      }),
      stub({ type: 'html.heading' })
    );
    const host = layer('hero', 'html.hero');
    const part = layer('headline', 'html.heading');
    const scene: Scene = legacyTestDocument([
      {
        id: 'p',
        name: 'P',
        layout: 'html',
        width: 100,
        height: 100,
        layers: [host],
      },
    ]);
    expect(resolveSlotRichTextToolbar('hero', part, scene, registry)).toEqual({
      blockType: false,
      link: false,
      code: false,
      align: false,
    });
  });
});
