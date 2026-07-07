import type { Scene } from '@openenvx/schema';

export interface PageResizeService {
  resizeSceneToPreset(scene: Scene, presetId: string): Scene | null;
}
