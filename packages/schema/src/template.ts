/**
 * Bannerbear-style template contract: named layers are addressable via
 * modifications. Pure scene transforms — shared by editor preview and cloud render.
 */
import type {
  CanvasCircleData,
  CanvasImageData,
  CanvasRectData,
  CanvasTextData,
  Layer,
  Scene,
} from './types';

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
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

export type TemplateFieldKind = 'text' | 'image' | 'color';

export interface TemplateField {
  name: string;
  kind: TemplateFieldKind;
  layerType: string;
  layerId: string;
  pageId: string;
  /** Sample / current value suitable for a form default. */
  sample?: string;
}

export interface TemplateManifest {
  schemaVersion: number;
  fields: TemplateField[];
}

/**
 * One modification targets a uniquely named layer.
 * Which optional fields are valid depends on the layer kind (see contract doc).
 */
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

function walkNamedLayers(
  layers: Layer[],
  pageId: string,
  visit: (layer: Layer, pageId: string) => void
): void {
  for (const layer of layers) {
    visit(layer, pageId);
    if (
      layer.type === 'canvas.group' &&
      layer.data &&
      typeof layer.data === 'object' &&
      Array.isArray((layer.data as { children?: unknown }).children)
    ) {
      walkNamedLayers(
        (layer.data as { children: Layer[] }).children,
        pageId,
        visit
      );
    }
  }
}

function forEachLayer(
  scene: Scene,
  visit: (layer: Layer, pageId: string) => void
): void {
  for (const page of scene.pages) {
    walkNamedLayers(page.layers, page.id, visit);
  }
}

function fieldKindForLayer(layer: Layer): TemplateFieldKind | null {
  switch (layer.type) {
    case 'canvas.text': {
      return 'text';
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

function sampleForLayer(
  layer: Layer,
  kind: TemplateFieldKind
): string | undefined {
  if (kind === 'text') {
    const data = layer.data as CanvasTextData;
    return typeof data.html === 'string'
      ? stripHtmlToPlainText(data.html)
      : undefined;
  }
  if (kind === 'image') {
    const data = layer.data as CanvasImageData;
    return typeof data.assetRef === 'string' ? data.assetRef : undefined;
  }
  if (kind === 'color') {
    const data = layer.data as
      | CanvasRectData
      | CanvasCircleData
      | CanvasTextData;
    return typeof data.fill === 'string' ? data.fill : undefined;
  }
  return undefined;
}

/** Collect named layers into a stable public template manifest. */
export function extractTemplateManifest(scene: Scene): TemplateManifest {
  const fields: TemplateField[] = [];
  forEachLayer(scene, (layer, pageId) => {
    const name = layer.name?.trim();
    if (!name) {
      return;
    }
    const kind = fieldKindForLayer(layer);
    if (!kind) {
      return;
    }
    fields.push({
      kind,
      layerId: layer.id,
      layerType: layer.type,
      name,
      pageId,
      sample: sampleForLayer(layer, kind),
    });
  });
  return {
    fields,
    schemaVersion: scene.schemaVersion,
  };
}

/** Report duplicate layer names (non-empty) across the whole scene. */
export function validateTemplateNames(scene: Scene): TemplateNameValidation {
  const counts = new Map<string, number>();
  forEachLayer(scene, (layer) => {
    const name = layer.name?.trim();
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

function findNamedLayer(
  scene: Scene,
  name: string
): { pageId: string; layer: Layer } | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  let match: { pageId: string; layer: Layer } | null = null;
  forEachLayer(scene, (layer, pageId) => {
    if (match) {
      return;
    }
    if (layer.name?.trim() === trimmed) {
      match = { layer, pageId };
    }
  });
  return match;
}

function mapLayers(layers: Layer[], mapper: (layer: Layer) => Layer): Layer[] {
  return layers.map((layer) => {
    const next = mapper(layer);
    if (
      next.type === 'canvas.group' &&
      next.data &&
      typeof next.data === 'object' &&
      Array.isArray((next.data as { children?: unknown }).children)
    ) {
      const children = (next.data as { children: Layer[] }).children;
      return {
        ...next,
        data: {
          ...next.data,
          children: mapLayers(children, mapper),
        },
      };
    }
    return next;
  });
}

function applyModificationToLayer(layer: Layer, mod: Modification): Layer {
  let next: Layer = { ...layer };
  let dataChanged = false;
  let data: Record<string, unknown> =
    layer.data && typeof layer.data === 'object'
      ? { ...(layer.data as Record<string, unknown>) }
      : {};

  if (mod.hidden !== undefined) {
    next = { ...next, visible: !mod.hidden };
  }

  if (layer.type === 'canvas.text') {
    if (mod.text !== undefined) {
      data = { ...data, html: plainTextToHtml(mod.text) };
      dataChanged = true;
    }
    if (mod.color !== undefined) {
      data = { ...data, fill: mod.color };
      dataChanged = true;
    }
    if (mod.fontFamily !== undefined) {
      data = { ...data, fontFamily: mod.fontFamily };
      dataChanged = true;
    }
    if (mod.fontSize !== undefined) {
      data = { ...data, fontSize: mod.fontSize };
      dataChanged = true;
    }
  } else if (layer.type === 'canvas.image') {
    if (mod.imageUrl !== undefined) {
      data = { ...data, assetRef: mod.imageUrl };
      dataChanged = true;
    }
  } else if (layer.type === 'canvas.rect' || layer.type === 'canvas.circle') {
    if (mod.color !== undefined) {
      data = { ...data, fill: mod.color };
      dataChanged = true;
    }
  }

  if (dataChanged) {
    next = { ...next, data };
  }
  return next;
}

/**
 * Clone the scene and apply modifications by layer name.
 * Unknown names are skipped. Duplicate names apply to the first match only
 * (callers should enforce uniqueness via `validateTemplateNames`).
 * Auto-fit / image-fit are layout-time; this only mutates stored values.
 */
export function applyModifications(
  scene: Scene,
  modifications: Modification[]
): Scene {
  if (modifications.length === 0) {
    return structuredClone(scene);
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
    return structuredClone(scene);
  }

  const clone = structuredClone(scene);
  clone.pages = clone.pages.map((page) => ({
    ...page,
    layers: mapLayers(page.layers, (layer) => {
      const name = layer.name?.trim();
      if (!name) {
        return layer;
      }
      const mod = byName.get(name);
      if (!mod) {
        return layer;
      }
      return applyModificationToLayer(layer, mod);
    }),
  }));
  return clone;
}

/** Find first layer by name (test helper). */
export function findTemplateLayerByName(
  scene: Scene,
  name: string
): Layer | null {
  return findNamedLayer(scene, name)?.layer ?? null;
}
