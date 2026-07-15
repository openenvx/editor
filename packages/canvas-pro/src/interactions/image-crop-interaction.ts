import {
  ImageCanvasInteraction,
  isImageEdgeAnchor,
  type CanvasHandleDragContext,
  type CanvasHandleLayoutContext,
  type CanvasLayerActivateContext,
  type CanvasTransformResult,
} from '@openenvx/canvas';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import type Konva from 'konva';

import { layoutCropHandles } from '../crop/image-crop-handle-geometry';
import { hasActiveCrop, readImageCrop } from '../crop/normalized-crop';
import {
  clearImageCropPreview,
  loadPreviewImage,
  renderImageCropPreview,
} from './image-crop-preview';
import {
  constrainImageEdgeCropBox,
  createImageCropSession,
  cropToTransform,
  isFullCrop,
  type ImageCropSession,
} from './image-crop-utils';

type ImageView = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

interface EdgeCropSession extends ImageCropSession {
  groupNode: Konva.Group;
}

const PREVIEW_ANCHOR = 'middle-right' as const;

function applyBoxToNode(
  node: Konva.Group,
  box: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  }
): void {
  node.position({ x: box.x, y: box.y });
  node.size({ width: box.width, height: box.height });
  node.scale({ x: 1, y: 1 });
  node.rotation(box.rotation);
}

function toLiveTransform(
  session: ImageCropSession,
  box: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  },
  opacity: number
): import('@openenvx/schema').Transform {
  return {
    height: box.height,
    opacity,
    rotation: box.rotation,
    width: box.width,
    x: box.x,
    y: box.y,
  };
}

export class ImageCropInteraction extends ImageCanvasInteraction {
  private readonly sessions = new Map<string, EdgeCropSession>();
  private readonly previewSessions = new Map<string, EdgeCropSession>();
  private readonly previewImages = new Map<string, HTMLImageElement | null>();
  private readonly edgeCropLayerIds = new Set<string>();

  providesHandles(_view: unknown): boolean {
    return true;
  }

  opensEditorOnReselect(view: unknown): boolean {
    if (!view || typeof view !== 'object' || !('kind' in view)) {
      return false;
    }
    if ((view as ImageView).kind !== 'image') {
      return false;
    }
    return hasActiveCrop(readImageCrop(view));
  }

  onLayerActivate(ctx: CanvasLayerActivateContext): void {
    const view = ctx.view as ImageView;
    if (view.kind !== 'image' || !hasActiveCrop(readImageCrop(view))) {
      return;
    }

    this.onLayerDeactivate(ctx.layerId);

    const group = ctx.node as Konva.Group;
    const originBox = {
      height: ctx.transform.height,
      rotation: ctx.transform.rotation,
      width: ctx.transform.width,
      x: ctx.transform.x,
      y: ctx.transform.y,
    };

    const session = createImageCropSession({
      anchor: PREVIEW_ANCHOR,
      naturalHeight: 1,
      naturalWidth: 1,
      originBox,
      originCrop: readImageCrop(view),
      originTransform: ctx.transform,
    }) as EdgeCropSession | null;

    if (!session) {
      return;
    }

    session.groupNode = group;
    this.previewSessions.set(ctx.layerId, session);
    this.mountCropPreview(ctx.layerId, view, group, originBox, session);
  }

  onLayerDeactivate(layerId: string): void {
    const session = this.previewSessions.get(layerId);
    if (session?.groupNode) {
      clearImageCropPreview(session.groupNode);
    }
    this.previewSessions.delete(layerId);
    if (!this.sessions.has(layerId)) {
      this.previewImages.delete(layerId);
    }
  }

  private mountCropPreview(
    layerId: string,
    view: ImageView,
    group: Konva.Group,
    originBox: {
      height: number;
      rotation: number;
      width: number;
      x: number;
      y: number;
    },
    session: EdgeCropSession
  ): void {
    void loadPreviewImage(view.src).then((image) => {
      if (!image || !this.previewSessions.has(layerId)) {
        return;
      }
      const activeSession = this.previewSessions.get(layerId);
      if (!activeSession) {
        return;
      }
      activeSession.naturalWidth = image.naturalWidth;
      activeSession.naturalHeight = image.naturalHeight;
      activeSession.scaleX =
        session.originTransform.width /
        (activeSession.originCrop.width * image.naturalWidth);
      activeSession.scaleY =
        session.originTransform.height /
        (activeSession.originCrop.height * image.naturalHeight);
      this.previewImages.set(layerId, image);
      renderImageCropPreview({
        frameBox: originBox,
        groupNode: group,
        image,
        session: activeSession,
      });
    });
  }

  layoutHandles(ctx: CanvasHandleLayoutContext) {
    return layoutCropHandles(ctx.transform, ctx.zoom);
  }

  hideContentDuringTransform(layerId: string): boolean {
    return (
      this.edgeCropLayerIds.has(layerId) || this.previewSessions.has(layerId)
    );
  }

  onHandleDragStart(ctx: CanvasHandleDragContext): void {
    this.previewSessions.delete(ctx.layerId);
    const anchor = ctx.anchor;
    if (!isImageEdgeAnchor(anchor)) {
      return;
    }

    const view = ctx.view as ImageView;
    const group = ctx.node as Konva.Group;
    const originBox = {
      height: ctx.transform.height,
      rotation: ctx.transform.rotation,
      width: ctx.transform.width,
      x: ctx.transform.x,
      y: ctx.transform.y,
    };

    const session = createImageCropSession({
      anchor,
      naturalHeight: 1,
      naturalWidth: 1,
      originBox,
      originCrop: readImageCrop(view),
      originTransform: ctx.transform,
    }) as EdgeCropSession | null;

    if (!session) {
      return;
    }

    session.groupNode = group;
    this.sessions.set(ctx.layerId, session);
    this.edgeCropLayerIds.add(ctx.layerId);

    ctx.setOverlays?.([
      {
        height: originBox.height,
        kind: 'rect',
        strokeWidth: 1,
        width: originBox.width,
        x: originBox.x,
        y: originBox.y,
      },
    ]);

    void loadPreviewImage(view.src).then((image) => {
      if (!image || !this.sessions.has(ctx.layerId)) {
        return;
      }
      const activeSession = this.sessions.get(ctx.layerId);
      if (!activeSession) {
        return;
      }
      activeSession.naturalWidth = image.naturalWidth;
      activeSession.naturalHeight = image.naturalHeight;
      activeSession.scaleX =
        ctx.transform.width /
        (activeSession.originCrop.width * image.naturalWidth);
      activeSession.scaleY =
        ctx.transform.height /
        (activeSession.originCrop.height * image.naturalHeight);
      this.previewImages.set(ctx.layerId, image);
      renderImageCropPreview({
        frameBox: originBox,
        groupNode: group,
        image,
        session: activeSession,
      });
    });
  }

  private applyCropDrag(
    ctx: CanvasHandleDragContext,
    pointerParentLocal: { x: number; y: number }
  ): void {
    const session = this.sessions.get(ctx.layerId);
    const group = session?.groupNode ?? (ctx.node as Konva.Group | null);
    if (!session || !group || !isImageEdgeAnchor(ctx.anchor)) {
      return;
    }

    const result = constrainImageEdgeCropBox(session, pointerParentLocal, 0, 0);
    session.previewCrop = result.crop;
    session.previewBox = result.box;
    applyBoxToNode(group, result.box);
    ctx.setLiveTransform?.(
      toLiveTransform(session, result.box, ctx.transform.opacity)
    );
    ctx.setOverlays?.([
      {
        height: result.box.height,
        kind: 'rect',
        strokeWidth: 1,
        width: result.box.width,
        x: result.box.x,
        y: result.box.y,
      },
    ]);

    const image = this.previewImages.get(ctx.layerId);
    if (image && session.naturalWidth > 1 && session.naturalHeight > 1) {
      renderImageCropPreview({
        frameBox: result.box,
        groupNode: group,
        image,
        session,
      });
    }
    group.getLayer()?.batchDraw();
  }

  onHandleDragMove(
    ctx: CanvasHandleDragContext,
    pointerParentLocal: { x: number; y: number }
  ): void {
    this.applyCropDrag(ctx, pointerParentLocal);
  }

  onHandleDragEnd(ctx: CanvasHandleDragContext): CanvasTransformResult | void {
    const group = ctx.node as Konva.Group;
    const session = this.sessions.get(ctx.layerId);

    clearImageCropPreview(group);
    this.sessions.delete(ctx.layerId);
    this.previewImages.delete(ctx.layerId);
    this.edgeCropLayerIds.delete(ctx.layerId);
    ctx.setLiveTransform?.(null);
    ctx.setOverlays?.([]);

    if (!session || !isImageEdgeAnchor(ctx.anchor)) {
      return;
    }

    const finalBox = session.previewBox;
    applyBoxToNode(group, finalBox);
    const crop = session.previewCrop;
    const nextCrop = isFullCrop(crop) ? undefined : crop;
    return {
      dataPatch: nextCrop ? { crop: nextCrop } : { crop: undefined },
      transform: cropToTransform(session, crop, finalBox),
    };
  }
}

export function canResetImageCrop(
  layerType: string,
  view: LayerPreviewDescriptor
): boolean {
  if (layerType !== 'canvas.image' || view.kind !== 'image') {
    return false;
  }
  return hasActiveCrop(readImageCrop(view));
}
