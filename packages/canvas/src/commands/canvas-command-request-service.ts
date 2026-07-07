import type { Transform } from '@openenvx/schema';

export class CanvasCommandRequestService {
  private pendingTransform: { layerId: string; transform: Transform } | null =
    null;
  private pendingRichTextTransform: {
    layerId: string;
    fontSize: number;
    transform: Transform;
  } | null = null;

  queueTransformUpdate(layerId: string, transform: Transform): void {
    this.pendingTransform = { layerId, transform };
  }

  takeQueuedTransformUpdate(): {
    layerId: string;
    transform: Transform;
  } | null {
    const update = this.pendingTransform;
    this.pendingTransform = null;
    return update;
  }

  hasQueuedTransformUpdate(): boolean {
    return this.pendingTransform !== null;
  }

  queueRichTextTransformUpdate(
    layerId: string,
    change: { fontSize: number; transform: Transform }
  ): void {
    this.pendingRichTextTransform = { ...change, layerId };
  }

  takeQueuedRichTextTransformUpdate(): {
    layerId: string;
    fontSize: number;
    transform: Transform;
  } | null {
    const update = this.pendingRichTextTransform;
    this.pendingRichTextTransform = null;
    return update;
  }

  hasQueuedRichTextTransformUpdate(): boolean {
    return this.pendingRichTextTransform !== null;
  }
}
