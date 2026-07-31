import type { Scene } from '@xmazu/openenvxee-schema';

export interface PageResizeService {
  resizeSceneToPreset(scene: Scene, presetId: string): Scene | null;
}
