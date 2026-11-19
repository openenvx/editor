import type { DocumentNode } from '@openenvx/editor';
import { updateNodeInTree, requireDocumentStore } from '@openenvx/editor';
import type { OpenEnvxWidgetProps } from '@openenvx/editor/schema';
import { applyNodeTransform, nodeTransform } from '@openenvx/editor/schema';
import type { CommandContext } from '@openenvx/studio';
import { Command } from '@openenvx/studio';

import { WIDGET_LAYER_TYPE } from '../layers/openenvx-widget-layer';

function unlockFace(nodes: DocumentNode[]): DocumentNode[] {
  return nodes.map((node) => {
    const nextChildren = node.children ? unlockFace(node.children) : undefined;
    return {
      ...node,
      writeMode: 'free' as const,
      showInLayers: true,
      children: nextChildren ?? node.children,
    };
  });
}

function detachedReplacement(primary: DocumentNode): DocumentNode {
  const props = (primary.props ?? {}) as unknown as OpenEnvxWidgetProps & {
    children?: DocumentNode[];
  };
  const children = unlockFace(primary.children ?? []);
  const isHtmlContext =
    primary.type === WIDGET_LAYER_TYPE &&
    children.some((child) => child.type.startsWith('html.'));
  const transform = nodeTransform(primary);
  const base = {
    id: primary.id,
    name: props.manifest?.label || primary.name || 'Detached widget',
    writeMode: 'free' as const,
    showInLayers: true,
  };
  if (isHtmlContext) {
    return applyNodeTransform(
      {
        ...base,
        type: 'html.flex',
        props: { direction: 'column', gap: 0 },
        children,
      },
      transform
    );
  }
  return applyNodeTransform(
    {
      ...base,
      type: 'canvas.group',
      children,
    },
    transform
  );
}

/**
 * Detach a widget: drop the extension binding and unlock the rendered face
 * as ordinary editable layers (replaces the widget in-tree, including nested).
 */
export class DetachWidgetCommand extends Command {
  readonly id = 'widget.detach';
  readonly title = 'Detach Widget';

  execute(ctx: CommandContext): void {
    const primary = requireDocumentStore(ctx).getPrimaryNode();
    if (!primary || primary.type !== WIDGET_LAYER_TYPE) {
      return;
    }
    const group = detachedReplacement(primary);

    requireDocumentStore(ctx).apply({
      label: 'Detach widget',
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) => {
          if (page.id !== requireDocumentStore(ctx).getActiveArtboard().id) {
            return page;
          }
          return {
            ...page,
            nodes: updateNodeInTree(page.nodes, primary.id, () => group),
          };
        }),
      }),
    });
  }
}
