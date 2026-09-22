import { Command, updateLayerInTree } from '@openenvx/studio';
import type { CommandContext, DocumentNode } from '@openenvx/studio';
import type { OpenEnvxWidgetProps } from '@openenvx/studio/schema';
import { applyNodeTransform, nodeTransform } from '@openenvx/studio/schema';

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
    const primary = ctx.scene.getPrimaryLayer();
    if (!primary || primary.type !== WIDGET_LAYER_TYPE) {
      return;
    }
    const group = detachedReplacement(primary);

    ctx.scene.apply({
      label: 'Detach widget',
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) => {
          if (page.id !== ctx.scene.getActiveArtboard().id) {
            return page;
          }
          return {
            ...page,
            nodes: updateLayerInTree(page.nodes, primary.id, () => group),
          };
        }),
      }),
    });
  }
}
