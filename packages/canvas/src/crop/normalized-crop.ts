export interface NormalizedCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_NORMALIZED_CROP: NormalizedCrop = {
  height: 1,
  width: 1,
  x: 0,
  y: 0,
};

export function resolveNormalizedCrop(
  crop?: NormalizedCrop | null
): NormalizedCrop {
  if (!crop) {
    return DEFAULT_NORMALIZED_CROP;
  }
  return crop;
}

export function clampNormalizedCrop(crop: NormalizedCrop): NormalizedCrop {
  let { height, width, x, y } = crop;
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));
  width = Math.max(0.001, Math.min(1 - x, width));
  height = Math.max(0.001, Math.min(1 - y, height));
  return { height, width, x, y };
}

export function hasActiveCrop(crop?: NormalizedCrop | null): boolean {
  if (!crop) {
    return false;
  }
  return crop.x > 0 || crop.y > 0 || crop.width < 1 || crop.height < 1;
}

export function readImageCrop(view: unknown): NormalizedCrop | undefined {
  if (!view || typeof view !== 'object' || !('crop' in view)) {
    return undefined;
  }
  const crop = (view as { crop?: unknown }).crop;
  if (
    !crop ||
    typeof crop !== 'object' ||
    !('x' in crop) ||
    !('y' in crop) ||
    !('width' in crop) ||
    !('height' in crop)
  ) {
    return undefined;
  }
  return crop as NormalizedCrop;
}
