import { findPresetForPage, getDefaultPageDimensions } from './page-presets';
import { SCHEMA_VERSION } from './types';
import type {
  Layer,
  LayerWriteMode,
  Page,
  Scene,
  SceneAsset,
  Selection,
  TemplatePolicy,
} from './types';

export function createDefaultTransform(): NonNullable<Layer['transform']> {
  return {
    height: 100,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    width: 200,
    x: 0,
    y: 0,
  };
}

export function createDefaultPage(
  id: string,
  layout: Page['layout'] = 'flow'
): Page {
  return {
    id,
    layers: [],
    layout,
    name: 'Page 1',
    ...(layout === 'absolute'
      ? (() => {
          const defaults = getDefaultPageDimensions();
          return { height: defaults.height, width: defaults.width };
        })()
      : {}),
  };
}

export function createDefaultSelection(activePageId: string): Selection {
  return {
    activePageId,
    primaryLayerId: null,
    selectedLayerIds: [],
  };
}

export function createEmptyScene(): Scene {
  const page = createDefaultPage('page-1', 'flow');
  return {
    activePageId: page.id,
    pages: [page],
    schemaVersion: SCHEMA_VERSION,
    selection: createDefaultSelection(page.id),
  };
}

export function normalizeScene(input: Partial<Scene>): Scene {
  const pages =
    input.pages?.map((page) => normalizePage(page)) ?? createEmptyScene().pages;
  const activePageId =
    input.activePageId && pages.some((p) => p.id === input.activePageId)
      ? input.activePageId
      : pages[0]!.id;

  const scene: Scene = {
    activePageId,
    assets: normalizeAssets(input.assets),
    pages,
    schemaVersion: input.schemaVersion ?? SCHEMA_VERSION,
    selection: normalizeSelection(input.selection, activePageId, pages),
  };

  const templatePolicy = normalizeTemplatePolicy(input.templatePolicy);
  if (templatePolicy) {
    scene.templatePolicy = templatePolicy;
  }

  return scene;
}

function normalizeTemplatePolicy(
  policy: Partial<TemplatePolicy> | undefined
): TemplatePolicy | undefined {
  if (!policy) {
    return undefined;
  }

  return {
    allowDeleteLayers: policy.allowDeleteLayers ?? true,
    allowDuplicateLayers: policy.allowDuplicateLayers ?? true,
    allowInsertLayers: policy.allowInsertLayers ?? true,
    allowPageResize: policy.allowPageResize ?? true,
    version: 1,
    ...(policy.frozenLayers
      ? { frozenLayers: { ...policy.frozenLayers } }
      : {}),
  };
}

function resolveLayerWriteMode(layer: Partial<Layer>): LayerWriteMode {
  return layer.writeMode ?? 'free';
}

function normalizeAssets(
  assets: Record<string, SceneAsset> | undefined
): Record<string, SceneAsset> | undefined {
  if (typeof assets !== 'object' || assets === null) {
    return undefined;
  }

  const result: Record<string, SceneAsset> = {};
  for (const [id, entry] of Object.entries(assets)) {
    if (
      entry &&
      entry.encoding === 'base64' &&
      typeof entry.data === 'string'
    ) {
      result[id] = {
        data: entry.data,
        encoding: 'base64',
        mimeType: entry.mimeType,
      };
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizePage(page: Partial<Page>): Page {
  const layout = page.layout === 'absolute' ? 'absolute' : 'flow';
  const unit = page.unit ?? 'px';
  const normalized: Page = {
    dpi: page.dpi ?? (unit === 'pt' ? 72 : 96),
    id: page.id ?? crypto.randomUUID(),
    layers: (page.layers ?? []).map(normalizeLayer),
    layout,
    name: page.name ?? 'Untitled',
    unit,
    ...(page.presetId ? { presetId: page.presetId } : {}),
    ...(page.backgroundColor ? { backgroundColor: page.backgroundColor } : {}),
    ...(layout === 'absolute'
      ? (() => {
          const defaults = getDefaultPageDimensions();
          return {
            height: page.height ?? defaults.height,
            width: page.width ?? defaults.width,
          };
        })()
      : {}),
  };

  if (layout === 'absolute' && !normalized.presetId) {
    const inferred = findPresetForPage(normalized);
    if (inferred) {
      normalized.presetId = inferred.id;
    }
  }

  return normalized;
}

function normalizeLayer(layer: Partial<Layer>): Layer {
  const data = normalizeLayerData(layer.type ?? 'unknown', layer.data ?? {});
  const writeMode = resolveLayerWriteMode(layer);
  return {
    data,
    id: layer.id ?? crypto.randomUUID(),
    locked: layer.locked ?? false,
    type: layer.type ?? 'unknown',
    writeMode,
    ...(layer.transform
      ? { transform: { ...createDefaultTransform(), ...layer.transform } }
      : {}),
    ...(layer.style ? { style: { ...layer.style } } : {}),
  };
}

function normalizeLayerData(type: string, data: unknown): unknown {
  if (type !== 'container' || typeof data !== 'object' || data === null) {
    return data;
  }
  const record = data as Record<string, unknown>;
  const children = Array.isArray(record.children)
    ? record.children.map((child) => normalizeLayer(child as Partial<Layer>))
    : [];
  return { ...record, children };
}

function collectLayerIds(layers: Layer[], ids: Set<string>): void {
  for (const layer of layers) {
    ids.add(layer.id);
    if (
      layer.type === 'container' &&
      typeof layer.data === 'object' &&
      layer.data !== null &&
      Array.isArray((layer.data as { children?: Layer[] }).children)
    ) {
      collectLayerIds((layer.data as { children: Layer[] }).children, ids);
    }
  }
}

function normalizeSelection(
  selection: Partial<Selection> | undefined,
  activePageId: string,
  pages: Page[]
): Selection {
  const page =
    pages.find((p) => p.id === (selection?.activePageId ?? activePageId)) ??
    pages[0]!;
  const validIds = new Set<string>();
  collectLayerIds(page.layers, validIds);
  const selectedLayerIds = (selection?.selectedLayerIds ?? []).filter((id) =>
    validIds.has(id)
  );
  const primaryLayerId =
    selection?.primaryLayerId && validIds.has(selection.primaryLayerId)
      ? selection.primaryLayerId
      : (selectedLayerIds[0] ?? null);

  return {
    activePageId: page.id,
    primaryLayerId,
    selectedLayerIds,
  };
}
