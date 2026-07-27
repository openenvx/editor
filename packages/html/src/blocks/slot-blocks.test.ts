import { hasChildLayers } from '@openenvx/core';
import { getNestedValue, setNestedValue } from '@openenvx/headless';
import type { Layer } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { BlockRegistryServiceId } from '../block-registry';
import { createHtmlLayerDefinition } from '../create-html-layer-definition';
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
  it('keeps hero atomic — slots are not data.children', () => {
    const hero = createHero();
    expect(hasChildLayers(hero)).toBe(false);
    expect(
      hero.data &&
        typeof hero.data === 'object' &&
        'slots' in (hero.data as object)
    ).toBe(true);
  });

  it('mints fresh slot part ids on create', () => {
    const a = createHero();
    const b = createHero();
    const aSlots = (a.data as { slots: Record<string, Layer[]> }).slots;
    const bSlots = (b.data as { slots: Record<string, Layer[]> }).slots;
    expect(aSlots.headline![0]!.id).not.toBe(bSlots.headline![0]!.id);
    expect(aSlots.actions![0]!.id).not.toBe(bSlots.actions![0]!.id);
  });

  it('resolves generated inspector keys through nested writes', () => {
    const hero = createHero();
    const data = structuredClone(hero.data) as Record<string, unknown>;
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
    const data = structuredClone(hero.data) as Record<string, unknown>;
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
    const heroSlots = (hero.data as { slots: Record<string, Layer[]> }).slots;
    const cloneSlots = (clone.data as { slots: Record<string, Layer[]> }).slots;
    expect(cloneSlots.headline![0]!.id).not.toBe(heroSlots.headline![0]!.id);
    expect(cloneSlots.body![0]!.id).not.toBe(heroSlots.body![0]!.id);
    expect(cloneSlots.actions![0]!.id).not.toBe(heroSlots.actions![0]!.id);
  });
});
