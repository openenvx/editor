import type { AssetService } from '@openenvx/core';
import type { Layer, Page } from '@openenvx/core/schema';
import { createDefaultTransform } from '@openenvx/core/schema';

import { computeArtboardOffset } from '../artboard-offset';
import { CanvasImageLayer } from '../layers/canvas-image-layer';
import { createLayerId } from './clone-layers-for-paste';
import {
  registerImagePastePreview,
  revokeImagePastePreview,
} from './image-paste-preview';
import type { CapturedClipboardPayload } from './read-external-clipboard';

const MAX_IMAGE_DIMENSION = 800;

export interface InternalClipboardPayload {
  layers: Layer[];
  origin: { x: number; y: number };
}

export interface ScreenPointer {
  screenX: number;
  screenY: number;
}

export interface ArtboardPointerContext {
  containerWidth: number;
  containerHeight: number;
  artboardWidth: number;
  artboardHeight: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface ExternalImagePasteResult {
  layer: Layer;
  /** Upload preview → durable ref. Does not revoke the object URL. */
  finalizeUpload: () => Promise<string>;
  /** Drop the session preview object URL for this layer. */
  revokePreview: () => void;
}

export class CanvasClipboardService {
  private internal: InternalClipboardPayload | null = null;
  private lastPointer: ScreenPointer | null = null;
  private focused = false;
  private editorActive = false;
  private editingText = false;
  private editingTextKeyCapture: ((event: KeyboardEvent) => void) | null = null;
  private stageHost: HTMLElement | null = null;
  private pointerContext: ArtboardPointerContext | null = null;
  private pendingCapturedPayload: CapturedClipboardPayload | null = null;
  private skipNextPasteEvent = false;

  setPendingCapturedPayload(payload: CapturedClipboardPayload | null): void {
    this.pendingCapturedPayload = payload;
  }

  consumePendingCapturedPayload(): CapturedClipboardPayload | null {
    const payload = this.pendingCapturedPayload;
    this.pendingCapturedPayload = null;
    return payload;
  }

  markInternalPasteFromShortcut(): void {
    this.skipNextPasteEvent = true;
  }

  consumeSkipNextPasteEvent(): boolean {
    const skip = this.skipNextPasteEvent;
    this.skipNextPasteEvent = false;
    return skip;
  }

  setStageHost(element: HTMLElement | null): void {
    this.stageHost = element;
  }

  setFocused(focused: boolean): void {
    this.focused = focused;
  }

  setEditorActive(active: boolean): void {
    this.editorActive = active;
  }

  isEditorActive(): boolean {
    return this.editorActive;
  }

  isFocused(): boolean {
    if (this.focused) {
      return true;
    }
    if (
      typeof document !== 'undefined' &&
      this.stageHost &&
      document.activeElement &&
      this.stageHost.contains(document.activeElement)
    ) {
      return true;
    }
    return false;
  }

  setEditingText(editing: boolean): void {
    if (editing === this.editingText) {
      return;
    }
    this.editingText = editing;
    if (typeof document === 'undefined') {
      return;
    }
    if (editing) {
      this.editingTextKeyCapture = (event: KeyboardEvent) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.stopPropagation();
        }
      };
      document.addEventListener('keydown', this.editingTextKeyCapture, true);
      return;
    }
    if (this.editingTextKeyCapture) {
      document.removeEventListener('keydown', this.editingTextKeyCapture, true);
      this.editingTextKeyCapture = null;
    }
  }

  isEditingText(): boolean {
    return this.editingText;
  }

  setLastPointer(pointer: ScreenPointer): void {
    this.lastPointer = pointer;
  }

  getLastPointer(): ScreenPointer | null {
    return this.lastPointer;
  }

  setInternal(payload: InternalClipboardPayload | null): void {
    this.internal = payload;
  }

  getInternal(): InternalClipboardPayload | null {
    return this.internal;
  }

  hasInternal(): boolean {
    return this.internal !== null && this.internal.layers.length > 0;
  }

  setPointerContext(context: ArtboardPointerContext): void {
    this.pointerContext = context;
  }

  getPointerContext(): ArtboardPointerContext | null {
    return this.pointerContext;
  }

  getPasteAnchor(context?: ArtboardPointerContext): { x: number; y: number } {
    const resolved = context ?? this.pointerContext;
    if (!resolved) {
      return { x: 0, y: 0 };
    }

    const artboardOffset = computeArtboardOffset(
      resolved.containerWidth,
      resolved.containerHeight,
      resolved.artboardWidth,
      resolved.artboardHeight,
      resolved.zoom,
      resolved.panX,
      resolved.panY
    );

    const pointer = this.lastPointer;
    const screenX = pointer?.screenX ?? resolved.containerWidth / 2;
    const screenY = pointer?.screenY ?? resolved.containerHeight / 2;

    return {
      x: (screenX - artboardOffset.x) / resolved.zoom,
      y: (screenY - artboardOffset.y) / resolved.zoom,
    };
  }

  /**
   * Build an image layer immediately (`uploading` + session blob preview).
   * Scene JSON keeps an empty `assetRef` until upload finishes — no `blob:` in history.
   * Pass `assets` from `ctx.services.get(AssetServiceId)` so host overrides apply.
   */
  createImageLayerFromExternalPaste(
    page: Page,
    anchor: { x: number; y: number },
    payload: { blob: Blob; naturalWidth: number; naturalHeight: number },
    assets: AssetService
  ): ExternalImagePasteResult | null {
    if (!assets.upload) {
      return null;
    }

    const extension = payload.blob.type.includes('svg')
      ? 'svg'
      : payload.blob.type.includes('jpeg')
        ? 'jpg'
        : payload.blob.type.includes('webp')
          ? 'webp'
          : 'png';
    const file = new File([payload.blob], `pasted-image.${extension}`, {
      type: payload.blob.type || 'image/png',
    });
    const previewUrl = URL.createObjectURL(payload.blob);
    const { width, height } = scaleImageDimensions(
      payload.naturalWidth,
      payload.naturalHeight
    );

    const layer = new CanvasImageLayer().createDefault(
      createLayerId('image'),
      page
    );
    layer.data = {
      alt: 'Pasted image',
      assetRef: '',
      uploading: true,
    };
    layer.transform = {
      ...createDefaultTransform(),
      x: anchor.x,
      y: anchor.y,
      width,
      height,
    };
    registerImagePastePreview(layer.id, previewUrl);

    return {
      layer,
      finalizeUpload: () => assets.upload!(file),
      revokePreview: () => {
        revokeImagePastePreview(layer.id);
      },
    };
  }
}

function scaleImageDimensions(
  width: number,
  height: number
): {
  width: number;
  height: number;
} {
  const maxDimension = Math.max(width, height);
  if (maxDimension <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }
  const scale = MAX_IMAGE_DIMENSION / maxDimension;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
