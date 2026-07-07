import type { Transform } from '@openenvx/schema';

export interface AlignBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getLayerBounds(transform: Transform): AlignBounds {
  return {
    height: transform.height,
    width: transform.width,
    x: transform.x,
    y: transform.y,
  };
}

export function alignTransforms(
  transforms: Transform[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Transform[] {
  if (transforms.length === 0) {
    return transforms;
  }

  const bounds = transforms.map(getLayerBounds);
  const minX = Math.min(...bounds.map((b) => b.x));
  const maxX = Math.max(...bounds.map((b) => b.x + b.width));
  const minY = Math.min(...bounds.map((b) => b.y));
  const maxY = Math.max(...bounds.map((b) => b.y + b.height));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return transforms.map((transform, index) => {
    const b = bounds[index]!;
    switch (alignment) {
      case 'left': {
        return { ...transform, x: minX };
      }
      case 'center': {
        return { ...transform, x: centerX - b.width / 2 };
      }
      case 'right': {
        return { ...transform, x: maxX - b.width };
      }
      case 'top': {
        return { ...transform, y: minY };
      }
      case 'middle': {
        return { ...transform, y: centerY - b.height / 2 };
      }
      case 'bottom': {
        return { ...transform, y: maxY - b.height };
      }
      default: {
        return transform;
      }
    }
  });
}

export function distributeHorizontally(transforms: Transform[]): Transform[] {
  if (transforms.length < 3) {
    return transforms;
  }
  const sorted = transforms.toSorted((a, b) => a.x - b.x);
  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  const totalWidth = sorted.reduce((sum, t) => sum + t.width, 0);
  const span = last.x + last.width - first.x;
  const gap = (span - totalWidth) / (sorted.length - 1);
  let cursor = first.x;
  return sorted.map((transform) => {
    const next = { ...transform, x: cursor };
    cursor += transform.width + gap;
    return next;
  });
}
