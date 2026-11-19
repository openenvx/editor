import type { Document } from '@openenvx/editor/schema';

export interface PageResizeService {
  resizeSceneToPreset(scene: Document, presetId: string): Document | null;
}
