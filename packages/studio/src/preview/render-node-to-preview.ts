import type { LayerPreviewDescriptor } from './layer-preview';
import type { RenderNode } from './render-document';

/** Map neutral `RenderNode` paint to legacy preview descriptors for Konva/export. */
export function renderNodeToLayerPreview(
  node: RenderNode
): LayerPreviewDescriptor {
  const { kind, paint } = node;
  if (kind === 'stack' && Array.isArray(paint.children)) {
    return {
      children: (paint.children as RenderNode[]).map(renderNodeToLayerPreview),
      direction: (paint.direction as 'horizontal' | 'vertical') ?? 'vertical',
      kind: 'stack',
    };
  }
  return { kind, ...paint } as LayerPreviewDescriptor;
}
