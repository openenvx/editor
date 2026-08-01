import { Command, updateLayerInTree } from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import type { OpenEnvxWidgetData } from '@openenvx/schema';

import { WIDGET_LAYER_TYPE } from '../layers/openenvx-widget-layer';

function unlockFace(layers: Layer[]): Layer[] {
  return layers.map((layer) => {
    const data = layer.data as { children?: Layer[] } | undefined;
    const nextChildren = data?.children ? unlockFace(data.children) : undefined;
    return {
      ...layer,
      writeMode: 'free' as const,
      showInLayers: true,
      data:
        nextChildren && data ? { ...data, children: nextChildren } : layer.data,
    };
  });
}

function detachedReplacement(primary: Layer): Layer {
  const data = primary.data as OpenEnvxWidgetData;
  const children = unlockFace(data.children ?? []);
  const isHtmlContext =
    primary.type === WIDGET_LAYER_TYPE &&
    children.some((child) => child.type.startsWith('html.'));
  return {
    id: primary.id,
    type: isHtmlContext ? 'html.flex' : 'canvas.group',
    name: data.manifest?.label || primary.name || 'Detached widget',
    transform: primary.transform,
    writeMode: 'free',
    showInLayers: true,
    data: isHtmlContext
      ? { direction: 'column', gap: 0, children }
      : { children },
  };
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
        pages: scene.pages.map((page) => {
          if (page.id !== ctx.scene.getActivePage().id) {
            return page;
          }
          return {
            ...page,
            layers: updateLayerInTree(page.layers, primary.id, () => group),
          };
        }),
      }),
    });
  }
}
