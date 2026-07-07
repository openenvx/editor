import type { Scene, SceneAsset } from '@openenvx/schema';

export type AssetResolver = (ref: string) => string;

function isInlineAsset(
  asset: SceneAsset
): asset is { encoding: 'base64'; data: string; mimeType: string } {
  return asset.encoding === 'base64';
}

export function createSceneAssetResolver(scene: Scene): AssetResolver {
  const assets = scene.assets ?? {};

  return (ref: string) => {
    if (
      ref.startsWith('http://') ||
      ref.startsWith('https://') ||
      ref.startsWith('data:')
    ) {
      return ref;
    }

    if (ref.startsWith('asset://')) {
      const id = ref.slice('asset://'.length);
      const asset = assets[id];
      if (asset && isInlineAsset(asset)) {
        return `data:${asset.mimeType};base64,${asset.data}`;
      }
    }

    return ref;
  };
}
