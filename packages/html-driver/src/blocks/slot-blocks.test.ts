import { hasChildLayers,getNestedValue,setNestedValue } from '@openenvx/studio';
import type { Layer } from '@openenvx/studio/schema';
import { nodeProps } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { BlockRegistryServiceId } from '../block-registry';
import { createHtmlLayerDefinition } from '../create-html-layer-definition';
import { blockProps } from '../test/document-fixtures';
import { createBlockRegistry } from '../test/html-editor-harness';
import { cloneBlockWithNewIds, createBlock } from '../tree/block-tree';
import { heroBlock } from './hero-block';

function createHero(): Layer {
  return createBlock('html.hero', 'hero-test', heroBlock.defaultData);
}

function createStubCtx() {
  const registry = createBlockRegistry();
  return {
    services: {
      has: (id: unknown) => id === BlockRegistryServiceId,
      get: () => registry,
    },
  };
}

describe('slot composite blocks', () => {
  it('keeps hero atomic - slots are not data.children', () => {
    const hero = createHero();
    expect(hasChildLayers(hero)).toBe(false);
    expect('slots' in blockProps(hero)).toBe(true);
  });

  it('mints fresh slot part ids on create', () => {
    const a = createHero();
    const b = createHero();
    const aSlots = blockProps(a).slots as Record<string, Layer[]>;
    const bSlots = blockProps(b).slots as Record<string, Layer[]>;
    expect(aSlots.headline![0]!.id).not.toBe(bSlots.headline![0]!.id);
    expect(aSlots.actions![0]!.id).not.toBe(bSlots.actions![0]!.id);
  });

  it('resolves generated inspector keys through nested writes', () => {
    const hero = createHero();
    const data = structuredClone(nodeProps(hero));
    setNestedValue(data, 'slots.headline.0.data.html', 'New title');
    expect(getNestedValue(data, 'slots.headline.0.data.html')).toBe(
      'New title'
    );
    setNestedValue(data, 'slots.body.0.visible', false);
    expect(getNestedValue(data, 'slots.body.0.visible')).toBe(false);
  });

  it('emits slotList and dotted slot fields from LayerDefinition.properties', () => {
    const definition = createHtmlLayerDefinition(heroBlock);
    const sections = definition.properties(
      createStubCtx() as never,
      createHero()
    );
    const fields = sections.flatMap((section) => section.fields);
    const keys = fields.map((field) => field.key);
    expect(keys).toContain('slots.headline.0.data.html');
    expect(keys).toContain('slots.body.0.visible');
    expect(keys).toContain('slots.actions');
    const actionsField = fields.find((field) => field.key === 'slots.actions');
    expect(actionsField?.kind).toBe('slotList');
    expect(actionsField?.slotList?.fields.some((f) => f.key === 'label')).toBe(
      true
    );
  });

  it('slot-list add/remove produce the expected part arrays', () => {
    const hero = createHero();
    const data = structuredClone(nodeProps(hero));
    const slots = data.slots as Record<string, Layer[]>;
    const template = slots.actions![0]!;
    const added: Layer = {
      ...structuredClone(template),
      id: `html-button-${crypto.randomUUID()}`,
    };
    const withAdded = [...slots.actions!, added];
    expect(withAdded).toHaveLength(2);
    expect(withAdded[1]!.id).not.toBe(withAdded[0]!.id);

    const removed = withAdded.filter((_, index) => index !== 0);
    expect(removed).toHaveLength(1);
    expect(removed[0]!.id).toBe(added.id);
  });

  it('cloneBlockWithNewIds reassigns slot part ids', () => {
    const hero = createHero();
    const clone = cloneBlockWithNewIds(
      hero,
      (type) => `${type.replaceAll('.', '-')}-clone`
    );
    expect(clone.id).not.toBe(hero.id);
    const heroSlots = blockProps(hero).slots as Record<string, Layer[]>;
    const cloneSlots = blockProps(clone).slots as Record<string, Layer[]>;
    expect(cloneSlots.headline![0]!.id).not.toBe(heroSlots.headline![0]!.id);
    expect(cloneSlots.body![0]!.id).not.toBe(heroSlots.body![0]!.id);
    expect(cloneSlots.actions![0]!.id).not.toBe(heroSlots.actions![0]!.id);
  });
});
