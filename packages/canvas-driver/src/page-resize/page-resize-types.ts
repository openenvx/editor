import type { Document } from '@openenvx/studio/schema';

export interface PageResizeService {
  resizeSceneToPreset(scene: Document, presetId: string): Document | null;
}
