import {
  createPropertyBuilder,
  escapeHtml,
  LayerDefinition,
} from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@xmazu/openenvxee-preview';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { z } from 'zod';

export const WIDGET_LAYER_TYPE = 'openenvx.widget';

/**
 * On-canvas sandbox widget node (Figma widget–class).
 * `syncedState` is local scene state until multiplayer/CRDT; API matches Figma useSyncedState shape.
 */
export const openenvxWidgetSchema = z.object({
  /** Sandbox extension grant id (`kind: 'widget'`). */
  extensionId: z.string().min(1),
  /** Local synced state blob (Figma useSyncedState-class); no CRDT yet. */
  syncedState: z.unknown().optional(),
  label: z.string().optional(),
});

export type OpenEnvxWidgetModel = z.infer<typeof openenvxWidgetSchema>;

export class OpenEnvxWidgetLayer extends LayerDefinition<OpenEnvxWidgetModel> {
  readonly type = WIDGET_LAYER_TYPE;
  readonly treeIcon = 'sparkles';
  readonly treeDisplayName = 'Widget';

  validate(data: unknown): data is OpenEnvxWidgetModel {
    return openenvxWidgetSchema.safeParse(data).success;
  }

  createDefault(id: string, _page: Page): Layer {
    return {
      data: {
        extensionId: 'demo-widget',
        syncedState: {},
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
      return parsed.data;
    }
    // Invalid data: empty extensionId so we do not silently bind a real grant.
    return { extensionId: '', syncedState: {}, label: 'Widget' };
  }

  properties(_ctx: CommandContext, _layer: Layer): PropertySectionDescriptor[] {
    return createPropertyBuilder()
      .section('Widget')
      .text('extensionId', 'Extension id')
      .text('label', 'Label')
      .build();
  }

  renderPreview(ctx: LayerPreviewContext<OpenEnvxWidgetModel>) {
    const label = escapeHtml(
      ctx.model.label?.trim() || ctx.model.extensionId || 'Widget'
    );
    // On-canvas object face (not an iframe). Clicks route to the sandbox.
    return createLayerPreviewBuilder().richText(
      `<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;box-sizing:border-box;border-radius:12px;background:#1f2937;border:2px solid #94a3b8;color:#f8fafc;font-weight:600">${label}</div>`,
      {
        align: 'center',
        fill: '#f8fafc',
        fontFamily: 'system-ui,sans-serif',
        fontSize: 18,
      }
    );
  }
}
