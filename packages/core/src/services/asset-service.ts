import type { Scene, SceneAsset } from '@openenvx/core/schema';

import type { Disposable } from '../runtime/emitter';
import { collectAssetRefs } from './collect-asset-refs';
import type { AssetService } from './types';

async function readFileAsBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCodePoint(bytes[i]!);
  }
  return btoa(binary);
}

function isInlineAsset(
  asset: SceneAsset
): asset is { encoding: 'base64'; data: string; mimeType: string } {
  return asset.encoding === 'base64';
}

/** In-memory asset service backed by base64 data URLs. */
export class InMemoryAssetService implements AssetService, Disposable {
  private readonly assets = new Map<string, SceneAsset>();

  resolveUrl(ref: string): string {
    if (
      ref.startsWith('http://') ||
      ref.startsWith('https://') ||
      ref.startsWith('data:')
    ) {
      return ref;
    }
    if (ref.startsWith('asset://')) {
      const id = ref.slice('asset://'.length);
      const asset = this.assets.get(id);
      if (asset && isInlineAsset(asset)) {
        return `data:${asset.mimeType};base64,${asset.data}`;
      }
      return ref;
    }
    return ref;
  }

  register(ref: string, asset: SceneAsset): void {
    this.assets.set(ref, asset);
  }

  async upload(file: File): Promise<string> {
    const id = crypto.randomUUID();
    const data = await readFileAsBase64(file);
    const asset: SceneAsset = {
      data,
      encoding: 'base64',
      mimeType: file.type || 'image/png',
    };
    this.assets.set(id, asset);
    return `asset://${id}`;
  }

  hydrate(assets: Record<string, SceneAsset> | undefined): void {
    this.assets.clear();
    if (assets) {
      for (const [id, asset] of Object.entries(assets)) {
        this.assets.set(id, asset);
      }
    }
  }

  exportReferenced(scene: Scene): Record<string, SceneAsset> {
    const refs = collectAssetRefs(scene);
    const exported: Record<string, SceneAsset> = {};
    for (const id of refs) {
      const asset = this.assets.get(id);
      if (asset) {
        exported[id] = asset;
      }
    }
    return exported;
  }

  dispose(): void {
    this.assets.clear();
  }
}
