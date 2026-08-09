import {
  createDefaultTransform,
  type Layer,
  type Transform,
} from '@openenvx/core/schema';
import type {
  RenderChild,
  RenderNode,
} from '@xmazu/openenvxee-extensions/protocol';
import { WIDGET_LAYER_ESCAPE_TYPES } from '@xmazu/openenvxee-extensions/protocol';

import { readLayoutIntent, resolveAutoLayout } from './resolve-auto-layout';

export interface MapWidgetTreeOptions {
  /** Id prefix for generated layers (usually the widget layer id). */
  idPrefix: string;
  /** Starting counter for unique child ids. */
  startIndex?: number;
  /**
   * Optional sink for face event handlers (childLayerId → event → handlerId).
   * When omitted, handler props on the tree are ignored.
   */
  handlersOut?: Record<string, Record<string, string>>;
}

const LAYER_ESCAPE = new Set<string>(WIDGET_LAYER_ESCAPE_TYPES);

function textContent(children: RenderChild[]): string {
  return children
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }
      if (child && typeof child === 'object' && child.type === 'Text') {
        return textContent(child.children);
      }
      return '';
    })
    .join('');
}

function boxTransform(
  props: Record<string, unknown>,
  fallback: Partial<Transform> = {}
): Transform {
  return {
    ...createDefaultTransform(),
    ...fallback,
    x: typeof props.x === 'number' ? props.x : (fallback.x ?? 0),
    y: typeof props.y === 'number' ? props.y : (fallback.y ?? 0),
    width:
      typeof props.width === 'number' ? props.width : (fallback.width ?? 100),
    height:
      typeof props.height === 'number' ? props.height : (fallback.height ?? 40),
  };
}

function faceMeta(): Pick<Layer, 'writeMode' | 'showInLayers'> {
  // Ordinary group parts: selectable, movable, deletable. Re-render from
  // isolate values still replaces children when `data.values` change.
  return { writeMode: 'free', showInLayers: true };
}

function recordHandlers(
  layerId: string,
  props: Record<string, unknown>,
  handlersOut?: Record<string, Record<string, string>>
): void {
  if (!handlersOut) {
    return;
  }
  const handlers: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      key.startsWith('on') &&
      typeof value === 'string' &&
      /^h\d+$/.test(value)
    ) {
      handlers[key.slice(2).toLowerCase()] = value;
    }
  }
  if (Object.keys(handlers).length > 0) {
    handlersOut[layerId] = handlers;
  }
}

/**
 * Map a validated canvas widget element tree to scene layers.
 * Stack / Grid positions are resolved on the host (fonts live here).
 */
export function mapWidgetTreeToLayers(
  root: RenderNode,
  options: MapWidgetTreeOptions
): Layer[] {
  let index = options.startIndex ?? 0;

  const nextId = (): string => {
    const id = `${options.idPrefix}:${index}`;
    index += 1;
    return id;
  };

  const mapNode = (node: RenderNode): Layer[] => {
    switch (node.type) {
      case 'Text': {
        const html =
          typeof node.props.value === 'string'
            ? node.props.value
            : textContent(node.children);
        const fontSize =
          typeof node.props.fontSize === 'number' ? node.props.fontSize : 16;
        const bound = typeof node.props.bind === 'string';
        const id = nextId();
        recordHandlers(id, node.props, options.handlersOut);
        const layer: Layer = {
          id,
          type: 'canvas.text',
          writeMode: 'free',
          showInLayers: true,
          ...(bound ? { allowedDataKeys: ['html'] } : {}),
          transform: boxTransform(node.props, {
            width:
              typeof node.props.width === 'number'
                ? node.props.width
                : Math.max(html.length * fontSize * 0.55, 40),
            height:
              typeof node.props.height === 'number'
                ? node.props.height
                : fontSize * 1.4,
          }),
          data: {
            html,
            fontSize,
            fill:
              typeof node.props.fill === 'string' ? node.props.fill : '#111827',
            fontFamily:
              typeof node.props.fontFamily === 'string'
                ? node.props.fontFamily
                : undefined,
            align:
              node.props.align === 'center' || node.props.align === 'right'
                ? node.props.align
                : 'left',
            ...(bound ? { bind: node.props.bind } : {}),
          },
        };
        return [layer];
      }
      case 'Rect': {
        return [
          {
            id: nextId(),
            type: 'canvas.rect',
            ...faceMeta(),
            transform: boxTransform(node.props),
            data: {
              fill:
                typeof node.props.fill === 'string'
                  ? node.props.fill
                  : '#3b82f6',
              stroke:
                typeof node.props.stroke === 'string'
                  ? node.props.stroke
                  : undefined,
              strokeWidth:
                typeof node.props.strokeWidth === 'number'
                  ? node.props.strokeWidth
                  : undefined,
              ...(typeof node.props.cornerRadius === 'number'
                ? {
                    cornerRadius: {
                      topLeft: node.props.cornerRadius,
                      topRight: node.props.cornerRadius,
                      bottomRight: node.props.cornerRadius,
                      bottomLeft: node.props.cornerRadius,
                    },
                  }
                : {}),
            },
          },
        ];
      }
      case 'Ellipse': {
        return [
          {
            id: nextId(),
            type: 'canvas.circle',
            ...faceMeta(),
            transform: boxTransform(node.props, { width: 80, height: 80 }),
            data: {
              fill:
                typeof node.props.fill === 'string'
                  ? node.props.fill
                  : '#22c55e',
              stroke:
                typeof node.props.stroke === 'string'
                  ? node.props.stroke
                  : undefined,
              strokeWidth:
                typeof node.props.strokeWidth === 'number'
                  ? node.props.strokeWidth
                  : undefined,
            },
          },
        ];
      }
      case 'Image': {
        const assetRef =
          (typeof node.props.assetRef === 'string' && node.props.assetRef) ||
          (typeof node.props.src === 'string' && node.props.src) ||
          '';
        return [
          {
            id: nextId(),
            type: 'canvas.image',
            ...faceMeta(),
            transform: boxTransform(node.props, { width: 200, height: 150 }),
            data: {
              assetRef,
              alt:
                typeof node.props.alt === 'string' ? node.props.alt : undefined,
              fit:
                node.props.fit === 'contain' ||
                node.props.fit === 'cover' ||
                node.props.fit === 'fill'
                  ? node.props.fit
                  : 'cover',
            },
          },
        ];
      }
      case 'SVG': {
        return [
          {
            id: nextId(),
            type: 'canvas.svg',
            ...faceMeta(),
            transform: boxTransform(node.props, { width: 64, height: 64 }),
            data: {
              svg: String(node.props.svg ?? ''),
              fill:
                typeof node.props.fill === 'string'
                  ? node.props.fill
                  : undefined,
            },
          },
        ];
      }
      case 'QR': {
        return [
          {
            id: nextId(),
            type: 'canvas.qr',
            ...faceMeta(),
            transform: boxTransform(node.props, { width: 128, height: 128 }),
            data: {
              url: String(node.props.value ?? ''),
              foreground:
                typeof node.props.foreground === 'string'
                  ? node.props.foreground
                  : undefined,
              background:
                typeof node.props.background === 'string'
                  ? node.props.background
                  : undefined,
            },
          },
        ];
      }
      case 'Layer': {
        const type =
          typeof node.props.type === 'string' &&
          LAYER_ESCAPE.has(node.props.type)
            ? node.props.type
            : null;
        if (!type) {
          return [];
        }
        const data: Record<string, unknown> = {};
        if (node.props.data && typeof node.props.data === 'object') {
          for (const [key, value] of Object.entries(
            node.props.data as Record<string, unknown>
          )) {
            if (
              key === 'children' ||
              key === 'writeMode' ||
              key === 'showInLayers' ||
              key === 'allowedDataKeys'
            ) {
              continue;
            }
            data[key] = value;
          }
        }
        return [
          {
            id: nextId(),
            type,
            ...faceMeta(),
            transform: boxTransform(node.props),
            data,
          },
        ];
      }
      case 'Instance': {
        return [
          {
            id: nextId(),
            type: 'canvas.instance',
            ...faceMeta(),
            transform: boxTransform(node.props, { width: 200, height: 200 }),
            data: {
              componentId: String(node.props.componentId ?? ''),
              overrides:
                node.props.overrides && typeof node.props.overrides === 'object'
                  ? (node.props.overrides as Record<
                      string,
                      Record<string, unknown>
                    >)
                  : undefined,
            },
          },
        ];
      }
      case 'Group':
      case 'Stack':
      case 'Grid': {
        const childLayers = node.children.flatMap((child) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return mapNode({
              type: 'Text',
              props: {},
              children: [child],
            });
          }
          if (!child || typeof child !== 'object') {
            return [];
          }
          return mapNode(child);
        });
        const intent = readLayoutIntent(node);
        const resolved = intent
          ? resolveAutoLayout(intent, childLayers, {
              width:
                typeof node.props.width === 'number'
                  ? node.props.width
                  : undefined,
              height:
                typeof node.props.height === 'number'
                  ? node.props.height
                  : undefined,
            })
          : {
              children: childLayers,
              width:
                typeof node.props.width === 'number' ? node.props.width : 200,
              height:
                typeof node.props.height === 'number' ? node.props.height : 200,
            };

        const fill =
          typeof node.props.fill === 'string' ? node.props.fill : undefined;
        const stroke =
          typeof node.props.stroke === 'string' ? node.props.stroke : undefined;
        const cornerRadius =
          typeof node.props.cornerRadius === 'number'
            ? node.props.cornerRadius
            : undefined;

        const groupId = nextId();
        recordHandlers(groupId, node.props, options.handlersOut);

        // When the layout has a visible chrome, wrap in a rect group via group+bg.
        if (fill || stroke || cornerRadius !== undefined) {
          const bgId = nextId();
          const bg: Layer = {
            id: bgId,
            type: 'canvas.rect',
            ...faceMeta(),
            transform: {
              ...createDefaultTransform(),
              x: 0,
              y: 0,
              width: resolved.width,
              height: resolved.height,
            },
            data: {
              fill: fill ?? 'transparent',
              stroke,
              strokeWidth:
                typeof node.props.strokeWidth === 'number'
                  ? node.props.strokeWidth
                  : stroke
                    ? 1
                    : undefined,
              ...(cornerRadius !== undefined
                ? {
                    cornerRadius: {
                      topLeft: cornerRadius,
                      topRight: cornerRadius,
                      bottomRight: cornerRadius,
                      bottomLeft: cornerRadius,
                    },
                  }
                : {}),
            },
          };
          return [
            {
              id: groupId,
              type: 'canvas.group',
              ...faceMeta(),
              transform: {
                ...createDefaultTransform(),
                x: typeof node.props.x === 'number' ? node.props.x : 0,
                y: typeof node.props.y === 'number' ? node.props.y : 0,
                width: resolved.width,
                height: resolved.height,
              },
              data: { children: [bg, ...resolved.children] },
            },
          ];
        }

        return [
          {
            id: groupId,
            type: 'canvas.group',
            ...faceMeta(),
            transform: {
              ...createDefaultTransform(),
              x: typeof node.props.x === 'number' ? node.props.x : 0,
              y: typeof node.props.y === 'number' ? node.props.y : 0,
              width: resolved.width,
              height: resolved.height,
            },
            data: { children: resolved.children },
          },
        ];
      }
      default: {
        return [];
      }
    }
  };

  return mapNode(root);
}
