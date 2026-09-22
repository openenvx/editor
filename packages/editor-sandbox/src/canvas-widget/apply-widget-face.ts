import type { RenderNode } from '@openenvx/editor-sandbox/protocol';
import { validateWidgetTree } from '@openenvx/editor-sandbox/protocol';
import {
  applyNodeTransform,
  defaultTransform,
  getChildNodes,
  nodeProps,
  nodeTransform,
  type DocumentNode,
  type OpenEnvxWidgetProps,
} from '@openenvx/studio/schema';

import { mapWidgetTreeToLayers } from './map-widget-tree-to-layers';

/**
 * Replace a canvas widget layer's rendered face from an element tree.
 * Unwraps a single root `canvas.group` into `children`, syncs
 * widget width/height to the laid-out face, and persists click handlers.
 * Face children are ordinary editable layers under the widget (group UX).
 * HTML faces use `@openenvx/html-driver` `applyHtmlWidgetFace`.
 */
export function applyWidgetFace(
  widgetLayer: DocumentNode,
  tree: RenderNode
): DocumentNode {
  validateWidgetTree(tree, 'canvas');
  const handlers: Record<string, Record<string, string>> = {};
  const mapped = mapWidgetTreeToLayers(tree, {
    idPrefix: widgetLayer.id,
    handlersOut: handlers,
  });
  const data = nodeProps(widgetLayer) as unknown as OpenEnvxWidgetProps;
  const root = mapped[0];

  let children = mapped;
  let faceWidth = widgetLayer.frame?.width;
  let faceHeight = widgetLayer.frame?.height;

  if (root && mapped.length === 1) {
    const rootTransform = nodeTransform(root);
    faceWidth = rootTransform.width;
    faceHeight = rootTransform.height;
    if (root.type === 'canvas.group') {
      children = getChildNodes(root);
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

  const prev = nodeTransform(widgetLayer);
  const nextTransform =
    typeof faceWidth === 'number' && typeof faceHeight === 'number'
      ? defaultTransform({
          ...prev,
          width: faceWidth,
          height: faceHeight,
        })
      : prev;

  return applyNodeTransform(
    {
      ...widgetLayer,
      children,
      props: {
        ...data,
        ...(Object.keys(handlers).length > 0
          ? { handlers }
          : { handlers: undefined }),
      },
    },
    nextTransform
  );
}
