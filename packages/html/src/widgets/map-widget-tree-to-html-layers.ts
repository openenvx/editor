import { sanitizeHtml } from '@openenvx/core';
import type { RenderChild, RenderNode } from '@openenvx/protocol';
import {
  validateWidgetTree,
  WIDGET_BLOCK_ESCAPE_TYPES,
} from '@openenvx/protocol';
import type { Layer } from '@openenvx/schema';

export interface MapWidgetHtmlTreeOptions {
  /** Id prefix for generated layers (usually the widget layer id). */
  idPrefix: string;
  /** Starting counter for unique child ids. */
  startIndex?: number;
  /** Collect click handler ids keyed by face layer id. */
  handlersOut?: Record<string, Record<string, string>>;
}

const BLOCK_ESCAPE = new Set<string>(WIDGET_BLOCK_ESCAPE_TYPES);

function textContent(children: RenderChild[]): string {
  return children
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }
      if (
        child &&
        typeof child === 'object' &&
        (child.type === 'Heading' ||
          child.type === 'Paragraph' ||
          child.type === 'Button')
      ) {
        return textContent(child.children);
      }
      return '';
    })
    .join('');
}

function faceMeta(): Pick<Layer, 'writeMode' | 'showInLayers'> {
  return { writeMode: 'content', showInLayers: false };
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

function plainData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (
      key === 'children' ||
      key === 'writeMode' ||
      key === 'showInLayers' ||
      key === 'allowedDataKeys'
    ) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Map a validated HTML widget element tree to html.* scene layers.
 * Browser flex handles layout — no host AutoLayout resolver.
 */
export function mapWidgetTreeToHtmlLayers(
  root: RenderNode,
  options: MapWidgetHtmlTreeOptions
): Layer[] {
  let index = options.startIndex ?? 0;

  const nextId = (): string => {
    const id = `${options.idPrefix}:html:${index}`;
    index += 1;
    return id;
  };

  const faceLayer = (
    props: Record<string, unknown>,
    layer: Omit<Layer, 'id' | 'writeMode' | 'showInLayers'>
  ): Layer => {
    const id = nextId();
    recordHandlers(id, props, options.handlersOut);
    return { id, ...faceMeta(), ...layer };
  };

  const mapChildren = (children: RenderChild[]): Layer[] =>
    children.flatMap((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return mapNode({
          type: 'Paragraph',
          props: {},
          children: [child],
        });
      }
      if (!child || typeof child !== 'object') {
        return [];
      }
      return mapNode(child);
    });

  const mapNode = (node: RenderNode): Layer[] => {
    switch (node.type) {
      case 'Section': {
        return [
          faceLayer(node.props, {
            type: 'html.flex',
            data: {
              direction: 'column',
              gap: 0,
              paddingY:
                typeof node.props.padding === 'number' ? node.props.padding : 0,
              background:
                typeof node.props.background === 'string'
                  ? node.props.background
                  : undefined,
              children: mapChildren(node.children),
            },
          }),
        ];
      }
      case 'Row': {
        return [
          faceLayer(node.props, {
            type: 'html.flex',
            data: {
              direction: 'row',
              gap: typeof node.props.gap === 'number' ? node.props.gap : 24,
              paddingY:
                typeof node.props.padding === 'number' ? node.props.padding : 0,
              background:
                typeof node.props.background === 'string'
                  ? node.props.background
                  : undefined,
              wrap: 'true',
              children: mapChildren(node.children),
            },
          }),
        ];
      }
      case 'Column': {
        return [
          faceLayer(node.props, {
            type: 'html.flex',
            data: {
              direction: 'column',
              gap: typeof node.props.gap === 'number' ? node.props.gap : 16,
              width: node.props.width,
              children: mapChildren(node.children),
            },
          }),
        ];
      }
      case 'Heading': {
        const html = sanitizeHtml(
          typeof node.props.html === 'string'
            ? node.props.html
            : textContent(node.children)
        );
        const bound = typeof node.props.bind === 'string';
        return [
          faceLayer(node.props, {
            type: 'html.heading',
            ...(bound ? { allowedDataKeys: ['html'] } : {}),
            data: {
              html,
              level: String(node.props.level ?? 2),
              color:
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#111827',
              ...(bound ? { bind: node.props.bind } : {}),
            },
          }),
        ];
      }
      case 'Paragraph': {
        const html = sanitizeHtml(
          typeof node.props.html === 'string'
            ? node.props.html
            : textContent(node.children)
        );
        const bound = typeof node.props.bind === 'string';
        return [
          faceLayer(node.props, {
            type: 'html.text',
            ...(bound ? { allowedDataKeys: ['html'] } : {}),
            data: {
              html,
              color:
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#374151',
              ...(bound ? { bind: node.props.bind } : {}),
            },
          }),
        ];
      }
      case 'Button': {
        return [
          faceLayer(node.props, {
            type: 'html.button',
            data: {
              label: textContent(node.children) || 'Button',
              href: typeof node.props.href === 'string' ? node.props.href : '#',
              color:
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#ffffff',
            },
          }),
        ];
      }
      case 'Image': {
        return [
          faceLayer(node.props, {
            type: 'html.image',
            data: {
              src: String(node.props.src ?? ''),
              alt: typeof node.props.alt === 'string' ? node.props.alt : '',
            },
          }),
        ];
      }
      case 'Divider': {
        return [
          faceLayer(node.props, {
            type: 'html.raw',
            data: {
              markup: `<hr style="border:none;border-top:1px solid ${
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#e5e7eb'
              };margin:1rem 0"/>`,
            },
          }),
        ];
      }
      case 'Html': {
        return [
          faceLayer(node.props, {
            type: 'html.raw',
            data: {
              markup: String(node.props.markup ?? ''),
            },
          }),
        ];
      }
      case 'Block': {
        const type =
          typeof node.props.type === 'string' &&
          BLOCK_ESCAPE.has(node.props.type)
            ? node.props.type
            : null;
        if (!type) {
          return [];
        }
        return [
          faceLayer(node.props, {
            type,
            data: plainData(node.props.data),
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

/**
 * Replace an HTML widget layer's rendered face from an element tree.
 */
export function applyHtmlWidgetFace(
  widgetLayer: Layer,
  tree: RenderNode
): Layer {
  validateWidgetTree(tree, 'html');
  const handlers: Record<string, Record<string, string>> = {};
  const mapped = mapWidgetTreeToHtmlLayers(tree, {
    idPrefix: widgetLayer.id,
    handlersOut: handlers,
  });
  const data = widgetLayer.data as Record<string, unknown>;
  return {
    ...widgetLayer,
    data: {
      ...data,
      children: mapped,
      ...(Object.keys(handlers).length > 0
        ? { handlers }
        : { handlers: undefined }),
    },
  };
}
