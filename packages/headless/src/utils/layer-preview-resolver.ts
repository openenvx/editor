import { AssetServiceId } from '@openenvx/core';
import type { PluginManager } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

export function resolveLayerPreview(
  view: LayerPreviewDescriptor,
  ctx: ReturnType<PluginManager['createCommandContext']>
): LayerPreviewDescriptor {
  if (view.kind !== 'image' || typeof view.src !== 'string') {
    return view;
  }
  const assets = ctx.services.get(AssetServiceId);
  return {
    ...view,
    src: assets?.resolveUrl(view.src) ?? view.src,
  };
}
