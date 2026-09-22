/**
 * Bannerbear-style template contract: named nodes are addressable via
 * modifications. Pure document transforms - shared by editor preview and cloud render.
 */
import { getChildNodes, hasChildNodes, nodeProps } from './node-helpers';
import type {
  CanvasCircleProps,
  CanvasImageProps,
  CanvasQrProps,
  CanvasRectProps,
  CanvasTextProps,
  Document,
  DocumentNode,
} from './types';

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replaceAll(/[&<>"']/g, (char) => HTML_ENTITY_MAP[char]!);
}

export function plainTextToHtml(text: string): string {
  const escaped = escapeHtml(text).replaceAll('\n', '<br/>');
  return `<p>${escaped}</p>`;
}

function stripHtmlToPlainText(html: string): string {
  return html
    .replaceAll(/<br\s*\/?>/gi, '\n')
    .replaceAll(/<\/p>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();
}

export type TemplateFieldKind = 'text' | 'image' | 'color' | 'qr';

export interface TemplateField {
  name: string;
  kind: TemplateFieldKind;
  layerType: string;
  layerId: string;
  artboardId: string;
  /** @deprecated use artboardId */
  pageId: string;
  sample?: string;
}

export interface TemplateManifest {
  schemaVersion: number;
  fields: TemplateField[];
}

export interface Modification {
  name: string;
  text?: string;
  imageUrl?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  hidden?: boolean;
}

export interface TemplateNameValidation {
  duplicates: string[];
}

function walkNamedNodes(
  nodes: DocumentNode[],
  artboardId: string,
  visit: (node: DocumentNode, artboardId: string) => void
): void {
  for (const node of nodes) {
    visit(node, artboardId);
    if (hasChildNodes(node)) {
      walkNamedNodes(getChildNodes(node), artboardId, visit);
    }
  }
}

function forEachNamedNode(
  document: Document,
  visit: (node: DocumentNode, artboardId: string) => void
): void {
  for (const artboard of document.artboards) {
    walkNamedNodes(artboard.nodes, artboard.id, visit);
  }
}

function fieldKindForNode(node: DocumentNode): TemplateFieldKind | null {
  switch (node.type) {
    case 'canvas.text': {
      return 'text';
    }
    case 'canvas.qr': {
      return 'qr';
    }
    case 'canvas.image': {
      return 'image';
    }
    case 'canvas.rect':
    case 'canvas.circle': {
      return 'color';
    }
    default: {
      return null;
    }
  }
}

function sampleForNode(
  node: DocumentNode,
  kind: TemplateFieldKind
): string | undefined {
  switch (kind) {
    case 'text': {
      const props = nodeProps(node) as unknown as CanvasTextProps;
      return typeof props.html === 'string'
        ? stripHtmlToPlainText(props.html)
        : undefined;
    }
    case 'qr': {
      const props = nodeProps(node) as unknown as CanvasQrProps;
      return typeof props.url === 'string' ? props.url : undefined;
    }
    case 'image': {
      const props = nodeProps(node) as CanvasImageProps;
      return typeof props.assetRef === 'string' ? props.assetRef : undefined;
    }
    case 'color': {
      const props = nodeProps(node) as unknown as
        | CanvasRectProps
        | CanvasCircleProps
        | CanvasTextProps;
      return typeof props.fill === 'string' ? props.fill : undefined;
    }
    default: {
      return undefined;
    }
  }
}

export function extractTemplateManifest(document: Document): TemplateManifest {
  const fields: TemplateField[] = [];
  forEachNamedNode(document, (node, artboardId) => {
    const name = node.name?.trim();
    if (!name) {
      return;
    }
    const kind = fieldKindForNode(node);
    if (!kind) {
      return;
    }
    fields.push({
      kind,
      layerId: node.id,
      layerType: node.type,
      name,
      artboardId,
      pageId: artboardId,
      sample: sampleForNode(node, kind),
    });
  });
  return {
    fields,
    schemaVersion: 1,
  };
}

export function validateTemplateNames(
  document: Document
): TemplateNameValidation {
  const counts = new Map<string, number>();
  forEachNamedNode(document, (node) => {
    const name = node.name?.trim();
    if (!name) {
      return;
    }
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  const duplicates: string[] = [];
  for (const [name, count] of counts) {
    if (count > 1) {
      duplicates.push(name);
    }
  }
  duplicates.sort();
  return { duplicates };
}

function findNamedNode(
  document: Document,
  name: string
): { artboardId: string; node: DocumentNode } | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  let match: { artboardId: string; node: DocumentNode } | null = null;
  forEachNamedNode(document, (node, artboardId) => {
    if (match) {
      return;
    }
    if (node.name?.trim() === trimmed) {
      match = { node, artboardId };
    }
  });
  return match;
}

function mapNodes(
  nodes: DocumentNode[],
  mapper: (node: DocumentNode) => DocumentNode
): DocumentNode[] {
  return nodes.map((node) => {
    const next = mapper(node);
    if (hasChildNodes(next)) {
      return {
        ...next,
        children: mapNodes(getChildNodes(next), mapper),
      };
    }
    return next;
  });
}

function applyModificationToNode(
  node: DocumentNode,
  mod: Modification
): DocumentNode {
  let next: DocumentNode = { ...node };
  let propsChanged = false;
  let props: Record<string, unknown> = {
    ...nodeProps(node),
  };

  if (mod.hidden !== undefined) {
    next = { ...next, visible: !mod.hidden };
  }

  if (node.type === 'canvas.text') {
    if (mod.text !== undefined) {
      props = { ...props, html: plainTextToHtml(mod.text) };
      propsChanged = true;
    }
    if (mod.color !== undefined) {
      props = { ...props, fill: mod.color };
      propsChanged = true;
    }
    if (mod.fontFamily !== undefined) {
      props = { ...props, fontFamily: mod.fontFamily };
      propsChanged = true;
    }
    if (mod.fontSize !== undefined) {
      props = { ...props, fontSize: mod.fontSize };
      propsChanged = true;
    }
  } else if (node.type === 'canvas.qr') {
    if (mod.text !== undefined) {
      props = { ...props, url: mod.text };
      propsChanged = true;
    }
    if (mod.color !== undefined) {
      props = { ...props, foreground: mod.color };
      propsChanged = true;
    }
  } else if (node.type === 'canvas.image') {
    if (mod.imageUrl !== undefined) {
      props = { ...props, assetRef: mod.imageUrl };
      propsChanged = true;
    }
  } else if (node.type === 'canvas.rect' || node.type === 'canvas.circle') {
    if (mod.color !== undefined) {
      props = { ...props, fill: mod.color };
      propsChanged = true;
    }
  }

  if (propsChanged) {
    next = { ...next, props };
  }
  return next;
}

export function applyModifications(
  document: Document,
  modifications: Modification[]
): Document {
  if (modifications.length === 0) {
    return structuredClone(document);
  }

  const byName = new Map<string, Modification>();
  for (const mod of modifications) {
    const key = mod.name.trim();
    if (!key) {
      continue;
    }
    byName.set(key, mod);
  }

  if (byName.size === 0) {
    return structuredClone(document);
  }

  const clone = structuredClone(document);
  clone.artboards = clone.artboards.map((artboard) => ({
    ...artboard,
    nodes: mapNodes(artboard.nodes, (node) => {
      const name = node.name?.trim();
      if (!name) {
        return node;
      }
      const mod = byName.get(name);
      if (!mod) {
        return node;
      }
      return applyModificationToNode(node, mod);
    }),
  }));
  return clone;
}

export function findTemplateLayerByName(
  document: Document,
  name: string
): DocumentNode | null {
  return findNamedNode(document, name)?.node ?? null;
}
