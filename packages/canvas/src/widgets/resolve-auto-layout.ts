import { createDefaultTransform, type Layer } from '@openenvx/core/schema';
import type { RenderNode } from '@xmazu/openenvxee-extensions/protocol';

import { fitCanvasTextLayerToContent } from '../fit-text-layer-to-content';

export type StackDirection = 'horizontal' | 'vertical';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/** Intent emitted for host-side layout (not absolute positions yet). */
export interface LayoutIntent {
  kind: 'autoLayout' | 'grid';
  direction: StackDirection;
  spacing: number;
  padding: { top: number; right: number; bottom: number; left: number };
  wrap: boolean;
  horizontalAlignItems: StackAlign;
  verticalAlignItems: StackAlign;
  columns?: number;
}

function normalizePadding(padding: unknown): LayoutIntent['padding'] {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  if (padding && typeof padding === 'object') {
    const record = padding as Record<string, number | undefined>;
    return {
      top: record.top ?? 0,
      right: record.right ?? 0,
      bottom: record.bottom ?? 0,
      left: record.left ?? 0,
    };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function readLayoutIntent(node: RenderNode): LayoutIntent | null {
  if (node.type === 'Grid') {
    return {
      kind: 'grid',
      direction: 'horizontal',
      spacing:
        typeof node.props.gap === 'number'
          ? node.props.gap
          : typeof node.props.spacing === 'number'
            ? node.props.spacing
            : 0,
      padding: normalizePadding(node.props.padding),
      wrap: true,
      horizontalAlignItems: 'start',
      verticalAlignItems: 'start',
      columns:
        typeof node.props.columns === 'number' && node.props.columns > 0
          ? node.props.columns
          : 2,
    };
  }
  if (node.type !== 'Stack' && node.type !== 'Group') {
    return null;
  }
  if (node.type === 'Group') {
    return {
      kind: 'autoLayout',
      direction: 'vertical',
      spacing: 0,
      padding: normalizePadding(node.props.padding),
      wrap: false,
      horizontalAlignItems: 'start',
      verticalAlignItems: 'start',
    };
  }
  const spacing =
    typeof node.props.gap === 'number'
      ? node.props.gap
      : typeof node.props.spacing === 'number'
        ? node.props.spacing
        : 0;
  return {
    kind: 'autoLayout',
    direction:
      node.props.direction === 'horizontal' ? 'horizontal' : 'vertical',
    spacing,
    padding: normalizePadding(node.props.padding),
    wrap: node.props.wrap === true,
    horizontalAlignItems:
      (node.props
        .horizontalAlignItems as LayoutIntent['horizontalAlignItems']) ??
      'start',
    verticalAlignItems:
      (node.props.verticalAlignItems as LayoutIntent['verticalAlignItems']) ??
      'start',
  };
}

function layerSize(layer: Layer): { width: number; height: number } {
  const transform = layer.transform ?? createDefaultTransform();
  return { width: transform.width, height: transform.height };
}

/**
 * Place child layers according to Stack / Grid intent.
 * Text layers are measured first via {@link fitCanvasTextLayerToContent}.
 *
 * ponytail: no wrap line-breaking for intrinsic-width children yet — explicit
 * widths required for wrap rows; upgrade with a real flex measure pass.
 */
export function resolveAutoLayout(
  intent: LayoutIntent,
  children: Layer[],
  containerSize?: { width?: number; height?: number }
): { children: Layer[]; width: number; height: number } {
  const measured = children.map((child) => {
    if (child.type === 'canvas.text') {
      return fitCanvasTextLayerToContent(child, { mode: 'box' });
    }
    return child;
  });

  if (intent.kind === 'grid') {
    return resolveGrid(intent, measured, containerSize);
  }

  const { padding, spacing, direction } = intent;
  let cursorX = padding.left;
  let cursorY = padding.top;
  let rowHeight = 0;
  let contentWidth = 0;
  let contentHeight = 0;
  const maxWidth =
    containerSize?.width && containerSize.width > 0
      ? containerSize.width
      : Number.POSITIVE_INFINITY;

  const placed = measured.map((child) => {
    const size = layerSize(child);
    if (
      intent.wrap &&
      direction === 'horizontal' &&
      cursorX + size.width > maxWidth - padding.right &&
      cursorX > padding.left
    ) {
      cursorX = padding.left;
      cursorY += rowHeight + spacing;
      rowHeight = 0;
    }

    const transform = child.transform ?? createDefaultTransform();
    const next: Layer = {
      ...child,
      transform: {
        ...transform,
        x: cursorX,
        y: cursorY,
        width: size.width,
        height: size.height,
      },
    };

    if (direction === 'horizontal') {
      cursorX += size.width + spacing;
      rowHeight = Math.max(rowHeight, size.height);
      contentWidth = Math.max(contentWidth, cursorX - spacing);
      contentHeight = Math.max(contentHeight, cursorY + size.height);
    } else {
      cursorY += size.height + spacing;
      contentWidth = Math.max(contentWidth, cursorX + size.width);
      contentHeight = Math.max(contentHeight, cursorY - spacing);
    }

    return next;
  });

  const width =
    containerSize?.width && containerSize.width > 0
      ? containerSize.width
      : Math.max(
          contentWidth + padding.right,
          padding.left + padding.right + 1
        );
  const height =
    containerSize?.height && containerSize.height > 0
      ? containerSize.height
      : Math.max(
          contentHeight + padding.bottom,
          padding.top + padding.bottom + 1
        );

  return { children: placed, width, height };
}

function resolveGrid(
  intent: LayoutIntent,
  children: Layer[],
  containerSize?: { width?: number; height?: number }
): { children: Layer[]; width: number; height: number } {
  const columns = intent.columns && intent.columns > 0 ? intent.columns : 2;
  const { padding, spacing } = intent;
  let cursorX = padding.left;
  let cursorY = padding.top;
  let col = 0;
  let rowHeight = 0;
  let contentWidth = 0;
  let contentHeight = 0;

  const placed = children.map((child) => {
    const size = layerSize(child);
    if (col >= columns) {
      col = 0;
      cursorX = padding.left;
      cursorY += rowHeight + spacing;
      rowHeight = 0;
    }

    const transform = child.transform ?? createDefaultTransform();
    const next: Layer = {
      ...child,
      transform: {
        ...transform,
        x: cursorX,
        y: cursorY,
        width: size.width,
        height: size.height,
      },
    };

    cursorX += size.width + spacing;
    rowHeight = Math.max(rowHeight, size.height);
    contentWidth = Math.max(contentWidth, cursorX - spacing);
    contentHeight = Math.max(contentHeight, cursorY + size.height);
    col += 1;
    return next;
  });

  const width =
    containerSize?.width && containerSize.width > 0
      ? containerSize.width
      : Math.max(
          contentWidth + padding.right,
          padding.left + padding.right + 1
        );
  const height =
    containerSize?.height && containerSize.height > 0
      ? containerSize.height
      : Math.max(
          contentHeight + padding.bottom,
          padding.top + padding.bottom + 1
        );

  return { children: placed, width, height };
}
