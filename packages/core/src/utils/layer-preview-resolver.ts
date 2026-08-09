import { AssetServiceId, type CommandContext } from '../backbone';
import type { LayerPreviewDescriptor } from '../preview';

export function resolveLayerPreview(
  view: LayerPreviewDescriptor,
  ctx: CommandContext
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
