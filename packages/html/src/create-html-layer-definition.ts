import { createPropertyBuilder, LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/preview';

import type { BlockConfig, FieldDef } from './block-config';

function treeIconFor(type: string): string {
  switch (type) {
    case 'html.heading':
    case 'html.text': {
      return 'text';
    }
    case 'html.image': {
      return 'image';
    }
    case 'html.root': {
      return 'file';
    }
    case 'html.flex':
    case 'html.grid':
    case 'html.container': {
      return 'box';
    }
    default: {
      return 'box';
    }
  }
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

/** Build a LayerDefinition from a Puck-style BlockConfig for inspector + layers tree. */
export function createHtmlLayerDefinition(
  config: BlockConfig
): LayerDefinition<Record<string, unknown>> {
  return new (class extends LayerDefinition<Record<string, unknown>> {
    readonly type = config.type;
    readonly treeIcon = treeIconFor(config.type);
    readonly treeDisplayName = config.label;

    createDefault(id: string, _page: Page): Layer {
      return {
        data: structuredClone(config.defaultData),
        id,
        type: config.type,
      };
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
      _ctx: CommandContext,
      _layer: Layer
    ): PropertySectionDescriptor[] {
      const fieldEntries = Object.entries(config.fields);
      if (fieldEntries.length === 0) {
        return [];
      }
      const section = createPropertyBuilder().section('props', config.label);
      for (const [key, field] of fieldEntries) {
        appendField(section, key, field);
      }
      return section.build();
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
