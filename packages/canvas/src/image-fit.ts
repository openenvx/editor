import type { FocalPoint, ImageFit } from '@openenvx/core/schema';

export interface ImageFitBox {
  width: number;
  height: number;
}

export interface ImageNaturalSize {
  width: number;
  height: number;
}

export interface ImageFitCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageFitLayout {
  /** Destination rect inside the layer box. */
  draw: { x: number; y: number; width: number; height: number };
  /** Optional source crop in natural image pixels (cover). */
  crop?: ImageFitCrop;
}

const DEFAULT_FOCAL: FocalPoint = { x: 0.5, y: 0.5 };

/**
 * Compute how to draw an image into a fixed box for cover / contain / fill.
 * Absent / unknown fit behaves as `fill` (legacy stretch) for back-compat.
 */
export function computeImageFitLayout(
  natural: ImageNaturalSize,
  box: ImageFitBox,
  fit: ImageFit | undefined,
  focalPoint?: FocalPoint | null
): ImageFitLayout {
  const imgW = Math.max(natural.width, 1);
  const imgH = Math.max(natural.height, 1);
  const boxW = Math.max(box.width, 0);
  const boxH = Math.max(box.height, 0);
  const mode = fit ?? 'fill';

  if (mode === 'fill' || boxW <= 0 || boxH <= 0) {
    return {
      draw: { height: boxH, width: boxW, x: 0, y: 0 },
    };
  }

  if (mode === 'contain') {
    const scale = Math.min(boxW / imgW, boxH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    return {
      draw: {
        height: drawH,
        width: drawW,
        x: (boxW - drawW) / 2,
        y: (boxH - drawH) / 2,
      },
    };
  }

  // cover
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const cropW = boxW / scale;
  const cropH = boxH / scale;
  const focal = focalPoint ?? DEFAULT_FOCAL;
  const fx = Math.min(1, Math.max(0, focal.x));
  const fy = Math.min(1, Math.max(0, focal.y));
  let cropX = fx * imgW - cropW / 2;
  let cropY = fy * imgH - cropH / 2;
  cropX = Math.min(Math.max(0, cropX), imgW - cropW);
  cropY = Math.min(Math.max(0, cropY), imgH - cropH);

  return {
    crop: { height: cropH, width: cropW, x: cropX, y: cropY },
    draw: { height: boxH, width: boxW, x: 0, y: 0 },
  };
}
