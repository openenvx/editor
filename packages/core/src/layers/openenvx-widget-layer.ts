import { createLayerPreviewBuilder } from '@openenvx/preview';
import {
  createDefaultTransform,
  type OpenEnvxWidgetData,
  type WidgetManifestSnapshot,
} from '@openenvx/schema';
import { z } from 'zod';

import {
  createPropertyBuilder,
  type PropertySectionDescriptor,
} from '../builders/property-builder';
import { appendWidgetManifestField } from '../builders/widget-manifest-fields';
import { LayerDefinition } from '../contributions/layer-definition';
import type { LayerPreviewContext } from '../contributions/layer-preview-context';
import type { CommandContext } from '../runtime/types';
import type { Layer, Page } from '../scene/types';

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

/**
 * Sandbox widget node shared by canvas and HTML engines.
 * Face lives in `data.children`; values drive re-render when Inspector / setProps
 * change them.
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
      appendWidgetManifestField(section, `values.${key}`, field);
    }
    return builder.build();
  }

  renderPreview(ctx: LayerPreviewContext<OpenEnvxWidgetModel>) {
    // Canvas: face paints via nested children; transparent envelope hit target.
    // HTML: placeholder until the isolate maps a face.
    if (ctx.model.children.length > 0) {
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
