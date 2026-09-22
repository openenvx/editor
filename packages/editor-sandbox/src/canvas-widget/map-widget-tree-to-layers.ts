import type {
  RenderChild,
  RenderNode,
} from '@openenvx/editor-sandbox/protocol';
import { WIDGET_LAYER_ESCAPE_TYPES } from '@openenvx/editor-sandbox/protocol';
import {
  defaultTransform,
  type DocumentNode as Layer,
} from '@openenvx/studio/schema';

import { buildFaceLayer, faceTransform } from './document-node-build';
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
        return [
          buildFaceLayer({
            id,
            type: 'canvas.text',
            writeMode: 'free',
            showInLayers: true,
            ...(bound ? { allowedPropKeys: ['html'] } : {}),
            props: {
              html,
              fontSize,
              fill:
                typeof node.props.fill === 'string'
                  ? node.props.fill
                  : '#111827',
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
            transform: faceTransform(node.props, {
              width:
                typeof node.props.width === 'number'
                  ? node.props.width
                  : Math.max(html.length * fontSize * 0.55, 40),
              height:
                typeof node.props.height === 'number'
                  ? node.props.height
                  : fontSize * 1.4,
            }),
          }),
        ];
      }
      case 'Rect': {
        return [
          buildFaceLayer({
            id: nextId(),
            type: 'canvas.rect',
            ...faceMeta(),
            props: {
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
            transform: faceTransform(node.props),
          }),
        ];
      }
      case 'Ellipse': {
        return [
          buildFaceLayer({
            id: nextId(),
            type: 'canvas.circle',
            ...faceMeta(),
            props: {
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
            transform: faceTransform(node.props, { width: 80, height: 80 }),
          }),
        ];
      }
      case 'Image': {
        const assetRef =
          (typeof node.props.assetRef === 'string' && node.props.assetRef) ||
          (typeof node.props.src === 'string' && node.props.src) ||
          '';
        return [
          buildFaceLayer({
            id: nextId(),
            type: 'canvas.image',
            ...faceMeta(),
            props: {
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
            transform: faceTransform(node.props, { width: 200, height: 150 }),
          }),
        ];
      }
      case 'SVG': {
        return [
          buildFaceLayer({
            id: nextId(),
            type: 'canvas.svg',
            ...faceMeta(),
            props: {
              svg: String(node.props.svg ?? ''),
              fill:
                typeof node.props.fill === 'string'
                  ? node.props.fill
                  : undefined,
            },
            transform: faceTransform(node.props, { width: 64, height: 64 }),
          }),
        ];
      }
      case 'QR': {
        return [
          buildFaceLayer({
            id: nextId(),
            type: 'canvas.qr',
            ...faceMeta(),
            props: {
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
            transform: faceTransform(node.props, { width: 128, height: 128 }),
          }),
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
        const props: Record<string, unknown> = {};
        if (node.props.data && typeof node.props.data === 'object') {
          for (const [key, value] of Object.entries(
            node.props.data as Record<string, unknown>
          )) {
            if (
              key === 'children' ||
              key === 'writeMode' ||
              key === 'showInLayers' ||
              key === 'allowedPropKeys' ||
              key === 'allowedDataKeys'
            ) {
              continue;
            }
            props[key] = value;
          }
        }
        return [
          buildFaceLayer({
            id: nextId(),
            type,
            ...faceMeta(),
            props,
            transform: faceTransform(node.props),
          }),
        ];
      }
      case 'Instance': {
        return [
          buildFaceLayer({
            id: nextId(),
            type: 'canvas.instance',
            ...faceMeta(),
            props: {
              componentId: String(node.props.componentId ?? ''),
              overrides:
                node.props.overrides && typeof node.props.overrides === 'object'
                  ? (node.props.overrides as Record<
                      string,
                      Record<string, unknown>
                    >)
                  : undefined,
            },
            transform: faceTransform(node.props, { width: 200, height: 200 }),
          }),
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
          const bg = buildFaceLayer({
            id: bgId,
            type: 'canvas.rect',
            ...faceMeta(),
            props: {
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
            transform: defaultTransform({
              x: 0,
              y: 0,
              width: resolved.width,
              height: resolved.height,
            }),
          });
          return [
            buildFaceLayer({
              id: groupId,
              type: 'canvas.group',
              ...faceMeta(),
              children: [bg, ...resolved.children],
              props: {},
              transform: defaultTransform({
                x: typeof node.props.x === 'number' ? node.props.x : 0,
                y: typeof node.props.y === 'number' ? node.props.y : 0,
                width: resolved.width,
                height: resolved.height,
              }),
            }),
          ];
        }

        return [
          buildFaceLayer({
            id: groupId,
            type: 'canvas.group',
            ...faceMeta(),
            children: resolved.children,
            props: {},
            transform: defaultTransform({
              x: typeof node.props.x === 'number' ? node.props.x : 0,
              y: typeof node.props.y === 'number' ? node.props.y : 0,
              width: resolved.width,
              height: resolved.height,
            }),
          }),
        ];
      }
      default: {
        return [];
      }
    }
  };

  return mapNode(root);
}
