import { SCHEMA_VERSION, type Layer, type Scene } from '@openenvx/core/schema';
import { isValidElement, type ReactElement, type ReactNode } from 'react';

import {
  EMAIL_JSX_TYPE,
  isEmailJsxComponent,
  type EmailJsxProps,
  type EmailJsxType,
} from './components';
import { stylePx, styleToBlockData } from './style-to-data';

const CONTAINER_TYPES = new Set<EmailJsxType>([
  'email.root',
  'email.section',
  'email.row',
  'email.column',
]);

export interface SceneFromEmailJsxOptions {
  pageId?: string;
  pageName?: string;
  rootId?: string;
}

function flattenChildren(children: ReactNode): ReactNode[] {
  if (
    children === null ||
    children === undefined ||
    children === false ||
    children === true
  ) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenChildren(child));
  }
  return [children];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Serialize Text/Heading children (strings, br, Link) to an HTML string. */
export function childrenToHtml(children: ReactNode): string {
  return flattenChildren(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return escapeHtml(String(child));
      }
      if (!isValidElement(child)) {
        return '';
      }
      if (child.type === 'br') {
        return '<br />';
      }
      if (
        isEmailJsxComponent(child.type) &&
        child.type[EMAIL_JSX_TYPE] === 'email.link'
      ) {
        const props = child.props as EmailJsxProps;
        const href = String(props.href ?? '#');
        const color =
          typeof props.style?.color === 'string'
            ? props.style.color
            : undefined;
        const body = childrenToHtml(props.children);
        const styleAttr = color ? ` style="color:${color}"` : '';
        return `<a href="${escapeHtml(href)}"${styleAttr}>${body}</a>`;
      }
      return childrenToHtml((child.props as EmailJsxProps).children);
    })
    .join('');
}

function createIdFactory(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `email-jsx-${n}`;
  };
}

function headingLevel(as: EmailJsxProps['as']): '1' | '2' | '3' {
  if (as === 'h1' || as === '1') {
    return '1';
  }
  if (as === 'h3' || as === '3') {
    return '3';
  }
  return '2';
}

function elementToLayer(element: ReactElement, nextId: () => string): Layer {
  // Expand local helpers (FeatureBlock, …) — they are not Scene nodes.
  if (
    typeof element.type === 'function' &&
    !isEmailJsxComponent(element.type)
  ) {
    const rendered = (element.type as (props: object) => ReactNode)(
      element.props as object
    );
    if (!isValidElement(rendered)) {
      throw new Error(
        'Email JSX helpers must return a single Email/Section/… element'
      );
    }
    return elementToLayer(rendered, nextId);
  }

  if (!isEmailJsxComponent(element.type)) {
    throw new Error(
      'Unsupported email JSX node: expected an Email/Section/… authoring component'
    );
  }

  const type = element.type[EMAIL_JSX_TYPE];
  if (type === 'email.link') {
    throw new Error(
      'email.link (Link) is only valid inside Text/Heading children'
    );
  }

  const props = element.props as EmailJsxProps;
  const data: Record<string, unknown> = {
    ...styleToBlockData(props.style),
  };

  if (props.align) {
    data.align = props.align;
  }
  if (props.verticalAlign) {
    data.verticalAlign = props.verticalAlign;
  }
  if (props.width !== undefined) {
    if (type === 'email.image' || type === 'email.imageLink') {
      // Image blocks expect numeric px — `Number("23px")` used to fall back to 600.
      data.width =
        typeof props.width === 'number'
          ? props.width
          : (stylePx(props.width) ?? props.width);
    } else {
      data.width =
        typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
  }
  if (props.height !== undefined) {
    data.height = props.height;
  }
  // styleToBlockData may stringify width; keep images numeric.
  if (
    (type === 'email.image' || type === 'email.imageLink') &&
    typeof data.width === 'string'
  ) {
    const parsed = stylePx(data.width);
    if (parsed !== undefined) {
      data.width = parsed;
    }
  }
  if (props.href !== undefined) {
    data.href = props.href;
  }
  if (props.src !== undefined) {
    data.src = props.src;
  }
  if (props.alt !== undefined) {
    data.alt = props.alt;
  }
  if (props.preheader !== undefined) {
    data.preheader = props.preheader;
  }
  if (props.label !== undefined) {
    data.label = props.label;
  }

  if (type === 'email.heading') {
    data.level = headingLevel(props.as);
    data.html = props.html ?? childrenToHtml(props.children);
  } else if (type === 'email.text') {
    data.html = props.html ?? childrenToHtml(props.children);
  } else if (type === 'email.button') {
    data.label =
      props.label ??
      (typeof props.children === 'string' || typeof props.children === 'number'
        ? String(props.children)
        : childrenToHtml(props.children));
    if (props.href !== undefined) {
      data.href = props.href;
    }
  }

  if (CONTAINER_TYPES.has(type)) {
    const childLayers: Layer[] = [];
    for (const child of flattenChildren(props.children)) {
      if (!isValidElement(child)) {
        continue;
      }
      if (
        isEmailJsxComponent(child.type) &&
        child.type[EMAIL_JSX_TYPE] === 'email.link'
      ) {
        continue;
      }
      childLayers.push(elementToLayer(child, nextId));
    }
    data.children = childLayers;
  }

  return {
    id: props.id ?? nextId(),
    type,
    ...(props.name?.trim() ? { name: props.name.trim() } : {}),
    data,
  } as Layer;
}

/**
 * Compile authoring JSX (`style={{ … }}` + Email/Section/…) into an editable email Scene.
 * Runtime editor still uses block `data` fields (paddingX, marginBottom, …).
 */
export function sceneFromEmailJsx(
  element: ReactElement,
  options?: SceneFromEmailJsxOptions
): Scene {
  const nextId = createIdFactory();
  const root = elementToLayer(element, nextId);

  if (root.type !== 'email.root') {
    throw new Error('sceneFromEmailJsx expects an <Email> root');
  }

  if (options?.rootId) {
    root.id = options.rootId;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    pages: [
      {
        id: options?.pageId ?? 'email-page',
        name: options?.pageName ?? 'Email',
        layout: 'email',
        layers: [root],
      },
    ],
  };
}
