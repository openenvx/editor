import {
  createPropertyBuilder,
  LayerDefinition,
  type RepeaterFieldConfig,
  type CommandContext,
  type Layer,
  type LayerPreviewContext,
  type Page,
  type PropertySectionDescriptor,
  type ServiceId,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/core/preview';

import type { BlockConfig, FieldDef, SlotDef } from './block-config';
import { BlockRegistryServiceId, type BlockRegistry } from './block-registry';
import { createBlock } from './tree/block-tree';

function treeIconFor(config: { type: string; treeIcon?: string }): string {
  if (config.treeIcon) {
    return config.treeIcon;
  }
  const { type } = config;
  if (type.endsWith('.heading') || type.endsWith('.text')) {
    return 'text';
  }
  if (type.endsWith('.image')) {
    return 'image';
  }
  if (type.endsWith('.root')) {
    return 'file';
  }
  return 'box';
}

type SectionBuilder = ReturnType<
  ReturnType<typeof createPropertyBuilder>['section']
>;

function appendField(
  section: SectionBuilder,
  key: string,
  field: FieldDef
): void {
  switch (field.kind) {
    case 'number': {
      section.number(key, field.label);
      break;
    }
    case 'select': {
      section.select(key, field.options, field.label);
      break;
    }
    case 'segmented': {
      section.segmented(key, field.options, field.label);
      break;
    }
    case 'color': {
      section.color(key, field.label);
      break;
    }
    case 'image': {
      section.image(key, field.label);
      break;
    }
    case 'richText': {
      section.richText(key, field.label);
      break;
    }
    case 'align': {
      section.align(key, field.label);
      break;
    }
    case 'toggle': {
      section.toggle(key, field.label);
      break;
    }
    case 'textarea':
    case 'text': {
      section.text(key, field.label);
      break;
    }
    default: {
      section.text(key, (field as FieldDef).label);
    }
  }
}

function fieldDefToRepeaterField(
  key: string,
  field: FieldDef
): RepeaterFieldConfig {
  if (field.kind === 'select') {
    return {
      key,
      kind: 'select',
      label: field.label,
      options: field.options,
    };
  }
  if (field.kind === 'segmented') {
    return {
      key,
      kind: 'segmented',
      label: field.label,
      options: field.options,
    };
  }
  if (field.kind === 'number') {
    return { key, kind: 'number', label: field.label };
  }
  if (field.kind === 'color') {
    return { key, kind: 'color', label: field.label };
  }
  if (field.kind === 'image') {
    return { key, kind: 'image', label: field.label };
  }
  if (field.kind === 'richText') {
    return { key, kind: 'richText', label: field.label };
  }
  if (field.kind === 'align') {
    return { key, kind: 'align', label: field.label };
  }
  if (field.kind === 'toggle') {
    return { key, kind: 'toggle', label: field.label };
  }
  if (field.kind === 'textarea') {
    return { key, kind: 'text', label: field.label };
  }
  return { key, kind: 'text', label: field.label };
}

function getRegistry(
  ctx: CommandContext,
  registryServiceId = BlockRegistryServiceId
): BlockRegistry | null {
  if (!ctx.services?.has(registryServiceId)) {
    return null;
  }
  return ctx.services.get(registryServiceId);
}

function appendSlotSections(
  builder: ReturnType<typeof createPropertyBuilder>,
  config: BlockConfig,
  registry: BlockRegistry
): void {
  if (!config.slots) {
    return;
  }
  for (const [slotKey, slotDef] of Object.entries(config.slots)) {
    appendSlotSection(builder, slotKey, slotDef, registry);
  }
}

function appendSlotSection(
  builder: ReturnType<typeof createPropertyBuilder>,
  slotKey: string,
  slotDef: SlotDef,
  registry: BlockRegistry
): void {
  const partConfig = registry.get(slotDef.partType);
  // ponytail: unregistered part types omit slot UI — register all slot partType values on BlockRegistry.
  if (!partConfig) {
    return;
  }
  if (slotDef.repeatable) {
    const newPart: Layer = {
      id: 'slot-part-template',
      type: slotDef.partType,
      data: structuredClone(partConfig.defaultData),
    };
    builder
      .section(`slot.${slotKey}`, slotDef.label)
      .slotList(`slots.${slotKey}`, {
        label: slotDef.label,
        newPart,
        fields: Object.entries(partConfig.fields).map(([key, field]) =>
          fieldDefToRepeaterField(key, field)
        ),
      });
    return;
  }
  const section = builder.section(`slot.${slotKey}`, slotDef.label);
  if (slotDef.optional) {
    section.toggle(`slots.${slotKey}.0.visible`, 'Show');
  }
  for (const [key, field] of Object.entries(partConfig.fields)) {
    appendField(section, `slots.${slotKey}.0.data.${key}`, field);
  }
}

export interface CreateHtmlLayerDefinitionOptions {
  registryServiceId?: ServiceId<BlockRegistry>;
}

/** Build a LayerDefinition from a Puck-style BlockConfig for inspector + layers tree. */
export function createHtmlLayerDefinition(
  config: BlockConfig,
  options?: CreateHtmlLayerDefinitionOptions
): LayerDefinition<Record<string, unknown>> {
  const registryServiceId =
    options?.registryServiceId ?? BlockRegistryServiceId;
  return new (class extends LayerDefinition<Record<string, unknown>> {
    readonly type = config.type;
    readonly treeIcon = treeIconFor(config);
    readonly treeDisplayName = config.label;

    createDefault(id: string, _page: Page): Layer {
      return createBlock(config.type, id, config.defaultData);
    }

    serialize(layer: Layer): Record<string, unknown> {
      return (layer.data ?? {}) as Record<string, unknown>;
    }

    deserialize(data: unknown): Record<string, unknown> {
      if (typeof data === 'object' && data !== null) {
        return data as Record<string, unknown>;
      }
      return structuredClone(config.defaultData);
    }

    properties(
      ctx: CommandContext,
      _layer: Layer
    ): PropertySectionDescriptor[] {
      const builder = createPropertyBuilder();
      const fieldEntries = Object.entries(config.fields);
      if (fieldEntries.length > 0) {
        const section = builder.section('props', config.label);
        for (const [key, field] of fieldEntries) {
          appendField(section, key, field);
        }
      }
      const registry = getRegistry(ctx, registryServiceId);
      if (registry && config.slots) {
        appendSlotSections(builder, config, registry);
      }
      return builder.build();
    }

    renderPreview(ctx: LayerPreviewContext<Record<string, unknown>>) {
      const htmlLabel =
        typeof ctx.model.html === 'string'
          ? ctx.model.html.replaceAll(/<[^>]+>/g, '').trim()
          : '';
      const label =
        htmlLabel ||
        (typeof ctx.model.alt === 'string' ? ctx.model.alt : config.label);
      return createLayerPreviewBuilder().placeholder(String(label));
    }
  })();
}
