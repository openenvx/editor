import type { CornerRadius, LayerShadow, Padding } from '@openenvx/schema';

export type BuiltinLayerPreviewDescriptor =
  | { kind: 'image'; src: string; alt?: string; [key: string]: unknown }
  | {
      kind: 'rect';
      fill: string;
      stroke?: string;
      strokeWidth?: number;
      cornerRadius?: number | CornerRadius;
      padding?: Padding;
      shadow?: LayerShadow;
      flipH?: boolean;
      flipV?: boolean;
    }
  | {
      kind: 'ellipse';
      fill: string;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      kind: 'stack';
      direction: 'horizontal' | 'vertical';
      children: LayerPreviewDescriptor[];
    }
  | {
      kind: 'richText';
      html: string;
      fontSize?: number;
      fontFamily?: string;
      fill?: string;
      align?: 'left' | 'center' | 'right';
      curve?: number;
      lineHeight?: number;
      letterSpacing?: number;
    }
  | { kind: 'placeholder'; text: string };

export type LayerPreviewDescriptor =
  | BuiltinLayerPreviewDescriptor
  | { kind: string; [key: string]: unknown };

export class LayerPreviewBuilder {
  image(src: string, alt?: string): LayerPreviewDescriptor {
    return { alt, kind: 'image', src };
  }

  rect(
    fill: string,
    options?: {
      stroke?: string;
      strokeWidth?: number;
      cornerRadius?: number | CornerRadius;
      padding?: Padding;
      shadow?: LayerShadow;
      flipH?: boolean;
      flipV?: boolean;
    }
  ): LayerPreviewDescriptor {
    return { fill, kind: 'rect', ...options };
  }

  ellipse(
    fill: string,
    options?: { stroke?: string; strokeWidth?: number }
  ): LayerPreviewDescriptor {
    return { fill, kind: 'ellipse', ...options };
  }

  stack(
    direction: 'horizontal' | 'vertical',
    children: LayerPreviewDescriptor[]
  ): LayerPreviewDescriptor {
    return { children, direction, kind: 'stack' };
  }

  richText(
    html: string,
    options?: {
      fontSize?: number;
      fontFamily?: string;
      fill?: string;
      align?: 'left' | 'center' | 'right';
      curve?: number;
      lineHeight?: number;
      letterSpacing?: number;
    }
  ): LayerPreviewDescriptor {
    return { html, kind: 'richText', ...options };
  }

  placeholder(text: string): LayerPreviewDescriptor {
    return { kind: 'placeholder', text };
  }
}

export function createLayerPreviewBuilder(): LayerPreviewBuilder {
  return new LayerPreviewBuilder();
}
