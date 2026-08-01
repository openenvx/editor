import type { Transform } from '@openenvx/schema';

export class CanvasCommandRequestService {
  private pendingTransform: {
    dataPatch?: Record<string, unknown>;
    layerId: string;
    transform: Transform;
  } | null = null;
  private pendingRichTextTransform: {
    layerId: string;
    fontSize: number;
    transform: Transform;
  } | null = null;

  queueTransformUpdate(
    layerId: string,
    transform: Transform,
    dataPatch?: Record<string, unknown>
  ): void {
    this.pendingTransform = { dataPatch, layerId, transform };
  }

  takeQueuedTransformUpdate(): {
    dataPatch?: Record<string, unknown>;
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

  peekQueuedTransformUpdate(): {
    dataPatch?: Record<string, unknown>;
    layerId: string;
    transform: Transform;
  } | null {
    return this.pendingTransform;
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

  peekQueuedRichTextTransformUpdate(): {
    layerId: string;
    fontSize: number;
    transform: Transform;
  } | null {
    return this.pendingRichTextTransform;
  }
}
