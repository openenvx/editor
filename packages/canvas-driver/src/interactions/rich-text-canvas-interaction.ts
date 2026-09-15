import { CanvasLayerInteractionContribution } from '../contributions/canvas-layer-interaction-contribution';
import { RICH_TEXT_ENABLED_ANCHORS } from './rich-text-transform-driver';

export class RichTextCanvasInteraction extends CanvasLayerInteractionContribution {
  readonly kind = 'richText';

  readonly usesEditOverlay = true;

  enabledAnchors(): readonly string[] {
    return RICH_TEXT_ENABLED_ANCHORS;
  }

  hideContentDuringTransform(): boolean {
    return true;
  }

  hideContentDuringEdit(
    editingLayerId: string | null,
    layerId: string
  ): boolean {
    return editingLayerId === layerId;
  }

  onDoubleClick(layerId: string): void {
    void layerId;
  }
}
