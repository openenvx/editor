import { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import { LayerPreviewRendererContribution } from '../contributions/layer-preview-renderer-contribution';
import { RichTextCanvasInteraction } from '../interactions/rich-text-canvas-interaction';
import { EllipseCanvasRenderer } from './ellipse-canvas-renderer';
import { ImageCanvasRenderer } from './image-canvas-renderer';
import { PlaceholderCanvasRenderer } from './placeholder-canvas-renderer';
import { ImagePreviewRenderer } from './preview/image-preview-renderer';
import { PlaceholderPreviewRenderer } from './preview/placeholder-preview-renderer';
import { RectPreviewRenderer } from './preview/rect-preview-renderer';
import { RichTextPreviewRenderer } from './preview/rich-text-preview-renderer';
import { StackPreviewRenderer } from './preview/stack-preview-renderer';
import { RectCanvasRenderer } from './rect-canvas-renderer';
import { RichTextCanvasRenderer } from './rich-text-canvas-renderer';

class RectCanvasRendererContribution extends CanvasLayerRendererContribution {
  readonly kind = 'rect';
  readonly Component = RectCanvasRenderer;
}

class EllipseCanvasRendererContribution extends CanvasLayerRendererContribution {
  readonly kind = 'ellipse';
  readonly Component = EllipseCanvasRenderer;
}

class ImageCanvasRendererContribution extends CanvasLayerRendererContribution {
  readonly kind = 'image';
  readonly Component = ImageCanvasRenderer;
}

class RichTextCanvasRendererContribution extends CanvasLayerRendererContribution {
  readonly kind = 'richText';
  readonly Component = RichTextCanvasRenderer;
}

class PlaceholderCanvasRendererContribution extends CanvasLayerRendererContribution {
  readonly kind = 'placeholder';
  readonly Component = PlaceholderCanvasRenderer;
}

class ImagePreviewRendererContribution extends LayerPreviewRendererContribution {
  readonly kind = 'image';
  readonly Component = ImagePreviewRenderer;
}

class StackPreviewRendererContribution extends LayerPreviewRendererContribution {
  readonly kind = 'stack';
  readonly Component = StackPreviewRenderer;
}

class RichTextPreviewRendererContribution extends LayerPreviewRendererContribution {
  readonly kind = 'richText';
  readonly Component = RichTextPreviewRenderer;
}

class PlaceholderPreviewRendererContribution extends LayerPreviewRendererContribution {
  readonly kind = 'placeholder';
  readonly Component = PlaceholderPreviewRenderer;
}

class RectPreviewRendererContribution extends LayerPreviewRendererContribution {
  readonly kind = 'rect';
  readonly Component = RectPreviewRenderer;
}

export const builtinCanvasRendererContributions = [
  new RectCanvasRendererContribution(),
  new EllipseCanvasRendererContribution(),
  new ImageCanvasRendererContribution(),
  new RichTextCanvasRendererContribution(),
  new PlaceholderCanvasRendererContribution(),
];

export const builtinLayerPreviewRendererContributions = [
  new ImagePreviewRendererContribution(),
  new StackPreviewRendererContribution(),
  new RichTextPreviewRendererContribution(),
  new PlaceholderPreviewRendererContribution(),
  new RectPreviewRendererContribution(),
];

export const builtinCanvasInteractionContributions = [
  new RichTextCanvasInteraction(),
];
