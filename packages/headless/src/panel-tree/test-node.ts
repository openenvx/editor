import type {
  PluginChild,
  PluginElementType,
  PluginNode,
  PluginPropValue,
} from '@xmazu/openenvxee-extensions/protocol';

/**
 * Test helper: build a PluginNode without the deleted hyperscript runtime.
 * Production authors use `@xmazu/openenvxee-extensions/panel` + Preact.
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
