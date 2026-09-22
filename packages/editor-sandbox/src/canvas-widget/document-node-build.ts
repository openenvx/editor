import {
  applyNodeTransform,
  defaultTransform,
  nodeTransform,
  type DocumentNode,
  type Transform,
} from '@openenvx/studio/schema';

export type FaceLayer = DocumentNode;

export function faceTransform(
  props: Record<string, unknown>,
  fallback: Partial<Transform> = {}
): Transform {
  return defaultTransform({
    ...fallback,
    x: typeof props.x === 'number' ? props.x : (fallback.x ?? 0),
    y: typeof props.y === 'number' ? props.y : (fallback.y ?? 0),
    width:
      typeof props.width === 'number' ? props.width : (fallback.width ?? 100),
    height:
      typeof props.height === 'number' ? props.height : (fallback.height ?? 40),
  });
}

export function buildFaceLayer(
  base: Omit<DocumentNode, 'frame' | 'opacity' | 'scaleX' | 'scaleY'> & {
    transform: Transform;
  }
): FaceLayer {
  const { transform, ...rest } = base;
  return applyNodeTransform(rest, transform);
}

export { nodeTransform, applyNodeTransform };
