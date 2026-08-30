import {
  createDefaultTransform,
  type Layer,
  type OpenEnvxWidgetData,
} from '@openenvx/core/schema';
import type { RenderNode } from '@xmazu/openenvxee-extensions/protocol';
import { validateWidgetTree } from '@xmazu/openenvxee-extensions/protocol';

import { mapWidgetTreeToLayers } from './map-widget-tree-to-layers';

/**
 * Replace a canvas widget layer's rendered face from an element tree.
 * Unwraps a single root `canvas.group` into `data.children`, syncs
 * widget width/height to the laid-out face, and persists click handlers.
 * Face children are ordinary editable layers under the widget (group UX).
 * HTML faces use `@openenvx/html` `applyHtmlWidgetFace`.
 */
export function applyWidgetFace(widgetLayer: Layer, tree: RenderNode): Layer {
  validateWidgetTree(tree, 'canvas');
  const handlers: Record<string, Record<string, string>> = {};
  const mapped = mapWidgetTreeToLayers(tree, {
    idPrefix: widgetLayer.id,
    handlersOut: handlers,
  });
  const data = widgetLayer.data as OpenEnvxWidgetData;
  const root = mapped[0];

  let children = mapped;
  let faceWidth = widgetLayer.transform?.width;
  let faceHeight = widgetLayer.transform?.height;

  if (root?.transform && mapped.length === 1) {
    faceWidth = root.transform.width;
    faceHeight = root.transform.height;
    if (root.type === 'canvas.group') {
      children = (root.data as { children: Layer[] }).children ?? [];
      // Root-group handlers (e.g. onClick on the outer Stack) retarget to the
      // widget envelope - the group id is discarded by unwrap.
      const rootHandlers = handlers[root.id];
      if (rootHandlers) {
        handlers[widgetLayer.id] = {
          ...handlers[widgetLayer.id],
          ...rootHandlers,
        };
        delete handlers[root.id];
      }
    }
  }

  const prev = widgetLayer.transform ?? createDefaultTransform();
  const nextTransform =
    typeof faceWidth === 'number' && typeof faceHeight === 'number'
      ? {
          ...prev,
          width: faceWidth,
          height: faceHeight,
        }
      : widgetLayer.transform;

  return {
    ...widgetLayer,
    transform: nextTransform,
    data: {
      ...data,
      children,
      ...(Object.keys(handlers).length > 0
        ? { handlers }
        : { handlers: undefined }),
    },
  };
}
