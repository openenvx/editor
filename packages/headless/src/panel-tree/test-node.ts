import type {
  PluginChild,
  PluginElementType,
  PluginNode,
  PluginPropValue,
} from '@xmazu/openenvxee-protocol';

/**
 * Test helper: build a PluginNode without the deleted hyperscript runtime.
 * Production authors use `@openenvx/elements/panel` + Preact.
 */
export function n(
  type: PluginElementType,
  props: Record<string, unknown> | null,
  ...children: PluginChild[]
): PluginNode {
  return {
    type,
    props: (props ?? {}) as Record<string, PluginPropValue>,
    children,
  };
}
