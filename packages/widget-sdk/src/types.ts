import type { RenderChild, RenderNode } from '@openenvx/protocol';

/** Field kinds that map onto PropertyBuilder / PLUGIN_FIELD_KINDS. */
export type WidgetFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'color'
  | 'image'
  | 'richText'
  | 'align'
  | 'toggle'
  | 'select'
  | 'font'
  | 'repeater'
  | 'border'
  | 'cornerRadius'
  | 'padding'
  | 'shadow';

export type WidgetFieldDef =
  | { kind: Exclude<WidgetFieldKind, 'select' | 'repeater'>; label: string }
  | {
      kind: 'select';
      label: string;
      options: { label: string; value: string }[];
    }
  | {
      kind: 'repeater';
      label: string;
      of: Record<string, WidgetFieldDef>;
    };

export type WidgetKind = 'canvas' | 'html';

/** Persisted on the widget layer so Inspector works without the source. */
export interface WidgetManifest {
  id: string;
  label: string;
  icon?: string;
  kinds: WidgetKind[];
  fields: Record<string, WidgetFieldDef>;
  defaults?: Record<string, unknown>;
}

/** Wire tree — always {@link RenderNode} from protocol. */
export type { RenderNode, RenderChild };
