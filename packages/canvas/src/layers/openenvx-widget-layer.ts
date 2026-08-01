import { createPropertyBuilder, LayerDefinition } from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@xmazu/openenvxee-preview';
import {
  createDefaultTransform,
  type OpenEnvxWidgetData,
  type WidgetFieldDef,
  type WidgetManifestSnapshot,
} from '@xmazu/openenvxee-schema';
import { z } from 'zod';

export const WIDGET_LAYER_TYPE = 'openenvx.widget';

const widgetManifestSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
  kinds: z.array(z.enum(['canvas', 'html'])).min(1),
  fields: z.record(z.string(), z.unknown()),
  defaults: z.record(z.string(), z.unknown()).optional(),
});

export const openenvxWidgetSchema = z.object({
  extensionId: z.string().min(1),
  values: z.record(z.string(), z.unknown()).default({}),
  manifest: widgetManifestSchema.optional(),
  children: z.array(z.unknown()).default([]),
  label: z.string().optional(),
});

export type OpenEnvxWidgetModel = OpenEnvxWidgetData;

function appendField(
  builder: ReturnType<ReturnType<typeof createPropertyBuilder>['section']>,
  path: string,
  field: WidgetFieldDef
): void {
  const label = field.label;
  switch (field.kind) {
    case 'number': {
      builder.number(path, label);
      break;
    }
    case 'color': {
      builder.color(path, label);
      break;
    }
    case 'toggle': {
      builder.toggle(path, label);
      break;
    }
    case 'image': {
      builder.image(path, label);
      break;
    }
    case 'richText': {
      builder.richText(path, label);
      break;
    }
    case 'align': {
      builder.align(path, label);
      break;
    }
    case 'select': {
      if ('options' in field) {
        builder.select(path, field.options, label);
      } else {
        builder.text(path, label);
      }
      break;
    }
    case 'repeater': {
      // ponytail: repeater of nested objects — expose as JSON text until PropertyBuilder
      // gains nested object repeater wiring for widget manifests.
      builder.text(path, `${label} (JSON)`);
      break;
    }
    default: {
      builder.text(path, label);
    }
  }
}

/**
 * On-canvas sandbox widget node (Figma widget–class + Unlayer face).
 * Face lives in `data.children` (editable group parts); values drive re-render
 * when the Inspector / setProps change them.
 */
export class OpenEnvxWidgetLayer extends LayerDefinition<OpenEnvxWidgetModel> {
  readonly type = WIDGET_LAYER_TYPE;
  readonly treeIcon = 'sparkles';
  readonly treeDisplayName = 'Widget';

  treeLabel(layer: Layer): string {
    const model = this.getModel(layer);
    return (
      layer.name?.trim() ||
      model.manifest?.label?.trim() ||
      model.label?.trim() ||
      this.treeDisplayName
    );
  }

  validate(data: unknown): data is OpenEnvxWidgetModel {
    return openenvxWidgetSchema.safeParse(data).success;
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: {
        extensionId: 'demo-widget',
        values: {},
        children: [],
        label: 'Widget',
      },
      id,
      transform: { ...createDefaultTransform(), height: 160, width: 240 },
      type: this.type,
      name: 'Widget',
    };
  }

  serialize(layer: Layer): OpenEnvxWidgetModel {
    return this.getModel(layer);
  }

  deserialize(data: unknown): OpenEnvxWidgetModel {
    const parsed = openenvxWidgetSchema.safeParse(data);
    if (parsed.success) {
      return {
        extensionId: parsed.data.extensionId,
        values: parsed.data.values,
        children: Array.isArray(parsed.data.children)
          ? (parsed.data.children.filter(
              (child) => child && typeof child === 'object' && 'id' in child
            ) as Layer[])
          : [],
        manifest: parsed.data.manifest as WidgetManifestSnapshot | undefined,
        label: parsed.data.label,
      };
    }
    return { extensionId: '', values: {}, children: [], label: 'Widget' };
  }

  properties(_ctx: CommandContext, layer: Layer): PropertySectionDescriptor[] {
    const model = this.getModel(layer);
    const builder = createPropertyBuilder();
    const manifest = model.manifest;

    if (!manifest?.fields || Object.keys(manifest.fields).length === 0) {
      return builder
        .section('Widget')
        .text('extensionId', 'Extension id')
        .text('label', 'Label')
        .build();
    }

    const section = builder.section(manifest.label || 'Widget');
    for (const [key, field] of Object.entries(manifest.fields)) {
      appendField(section, `values.${key}`, field);
    }
    return builder.build();
  }

  renderPreview(ctx: LayerPreviewContext<OpenEnvxWidgetModel>) {
    // Face is painted from data.children via the stage flattener.
    // Empty state when the widget has not rendered yet.
    if (ctx.model.children.length > 0) {
      // Face paints via nested children; transparent envelope hit target only.
      return createLayerPreviewBuilder().rect('transparent');
    }
    const label =
      ctx.model.manifest?.label?.trim() ||
      ctx.model.label?.trim() ||
      ctx.model.extensionId ||
      'Widget';
    return createLayerPreviewBuilder().richText(
      `<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;box-sizing:border-box;border:1px dashed #94a3b8;border-radius:8px;color:#64748b;font:600 14px system-ui,sans-serif">${label}</div>`,
      {
        align: 'center',
        fill: '#64748b',
        fontFamily: 'system-ui,sans-serif',
        fontSize: 14,
      }
    );
  }
}
