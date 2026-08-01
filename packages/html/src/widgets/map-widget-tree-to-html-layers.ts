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
  return { writeMode: 'free', showInLayers: true };
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
          {
            id: nextId(),
            type: 'html.flex',
            ...faceMeta(),
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
          },
        ];
      }
      case 'Row': {
        return [
          {
            id: nextId(),
            type: 'html.flex',
            ...faceMeta(),
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
          },
        ];
      }
      case 'Column': {
        return [
          {
            id: nextId(),
            type: 'html.flex',
            ...faceMeta(),
            data: {
              direction: 'column',
              gap: typeof node.props.gap === 'number' ? node.props.gap : 16,
              width: node.props.width,
              children: mapChildren(node.children),
            },
          },
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
          {
            id: nextId(),
            type: 'html.heading',
            writeMode: 'free',
            showInLayers: true,
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
          },
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
          {
            id: nextId(),
            type: 'html.text',
            writeMode: 'free',
            showInLayers: true,
            ...(bound ? { allowedDataKeys: ['html'] } : {}),
            data: {
              html,
              color:
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#374151',
              ...(bound ? { bind: node.props.bind } : {}),
            },
          },
        ];
      }
      case 'Button': {
        return [
          {
            id: nextId(),
            type: 'html.button',
            ...faceMeta(),
            data: {
              label: textContent(node.children) || 'Button',
              href: typeof node.props.href === 'string' ? node.props.href : '#',
              color:
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#ffffff',
            },
          },
        ];
      }
      case 'Image': {
        return [
          {
            id: nextId(),
            type: 'html.image',
            ...faceMeta(),
            data: {
              src: String(node.props.src ?? ''),
              alt: typeof node.props.alt === 'string' ? node.props.alt : '',
            },
          },
        ];
      }
      case 'Divider': {
        return [
          {
            id: nextId(),
            type: 'html.raw',
            ...faceMeta(),
            data: {
              markup: `<hr style="border:none;border-top:1px solid ${
                typeof node.props.color === 'string'
                  ? node.props.color
                  : '#e5e7eb'
              };margin:1rem 0"/>`,
            },
          },
        ];
      }
      case 'Html': {
        return [
          {
            id: nextId(),
            type: 'html.raw',
            ...faceMeta(),
            data: {
              markup: String(node.props.markup ?? ''),
            },
          },
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
          {
            id: nextId(),
            type,
            ...faceMeta(),
            data: plainData(node.props.data),
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

/**
 * Replace an HTML widget layer's rendered face from an element tree.
 */
export function applyHtmlWidgetFace(
  widgetLayer: Layer,
  tree: RenderNode
): Layer {
  validateWidgetTree(tree, 'html');
  const mapped = mapWidgetTreeToHtmlLayers(tree, { idPrefix: widgetLayer.id });
  const data = widgetLayer.data as Record<string, unknown>;
  return {
    ...widgetLayer,
    data: {
      ...data,
      children: mapped,
      handlers: undefined,
    },
  };
}
