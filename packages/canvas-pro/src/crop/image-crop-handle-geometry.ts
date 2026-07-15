import {
  IMAGE_EDGE_ANCHORS,
  type ImageEdgeAnchor,
  type HandleDescriptor,
} from '@openenvx/canvas';
import type { Transform } from '@openenvx/schema';

const HANDLE_SIZE = 8;

function localEdgePoint(
  width: number,
  height: number,
  anchor: ImageEdgeAnchor
): { x: number; y: number } {
  switch (anchor) {
    case 'middle-left': {
      return { x: 0, y: height / 2 };
    }
    case 'middle-right': {
      return { x: width, y: height / 2 };
    }
    case 'top-center': {
      return { x: width / 2, y: 0 };
    }
    case 'bottom-center': {
      return { x: width / 2, y: height };
    }
    default: {
      return { x: 0, y: 0 };
    }
  }
}

function parentPointFromLocal(
  transform: Transform,
  local: { x: number; y: number }
): { x: number; y: number } {
  const rotationRad = (transform.rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  return {
    x: transform.x + local.x * cos - local.y * sin,
    y: transform.y + local.x * sin + local.y * cos,
  };
}

export function layoutCropHandles(
  transform: Transform,
  zoom: number
): HandleDescriptor[] {
  const handleSize = HANDLE_SIZE / Math.max(zoom, 0.01);
  const half = handleSize / 2;

  return IMAGE_EDGE_ANCHORS.map((anchor) => {
    const center = parentPointFromLocal(
      transform,
      localEdgePoint(transform.width, transform.height, anchor)
    );
    return {
      anchor,
      height: handleSize,
      rotation: transform.rotation,
      width: handleSize,
      x: center.x - half,
      y: center.y - half,
    };
  });
}
