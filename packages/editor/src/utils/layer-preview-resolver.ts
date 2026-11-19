import type { CommandContext } from '@openenvx/studio';

import type { LayerPreviewDescriptor } from '../preview';
import { AssetServiceId } from '../tokens';

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
