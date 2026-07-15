export interface LayerSummary {
  id: string;
  type: string;
  name?: string;
  bounds?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  locked?: boolean;
  dataKeys?: string[];
}

export interface PageSummary {
  id: string;
  name?: string;
  width?: number;
  height?: number;
  layerCount: number;
}

function layerName(data: Record<string, unknown>): string | undefined {
  if (typeof data.name === 'string') {
    return data.name;
  }
  if (typeof data.label === 'string') {
    return data.label;
  }
  return undefined;
}

function summarizeLayer(layer: Record<string, unknown>): LayerSummary {
  const data =
    typeof layer.data === 'object' && layer.data !== null
      ? (layer.data as Record<string, unknown>)
      : {};
  const transform =
    typeof layer.transform === 'object' && layer.transform !== null
      ? (layer.transform as Record<string, unknown>)
      : undefined;
  const name = layerName(data);

  return {
    id: String(layer.id),
    type: String(layer.type),
    ...(name ? { name } : {}),
    ...(transform
      ? {
          bounds: {
            ...(typeof transform.x === 'number' ? { x: transform.x } : {}),
            ...(typeof transform.y === 'number' ? { y: transform.y } : {}),
            ...(typeof transform.width === 'number'
              ? { width: transform.width }
              : {}),
            ...(typeof transform.height === 'number'
              ? { height: transform.height }
              : {}),
          },
        }
      : {}),
    ...(layer.locked ? { locked: true } : {}),
    ...(Object.keys(data).length > 0 ? { dataKeys: Object.keys(data) } : {}),
  };
}

function collectLayers(layers: unknown[], result: LayerSummary[]): void {
  for (const layer of layers) {
    if (typeof layer !== 'object' || layer === null) {
      continue;
    }
    const record = layer as Record<string, unknown>;
    result.push(summarizeLayer(record));
    if (Array.isArray(record.children)) {
      collectLayers(record.children, result);
    }
    const data =
      typeof record.data === 'object' && record.data !== null
        ? (record.data as Record<string, unknown>)
        : {};
    if (Array.isArray(data.children)) {
      collectLayers(data.children, result);
    }
    if (Array.isArray(record.layers)) {
      collectLayers(record.layers, result);
    }
  }
}

export function buildLayerSummary(
  sceneContext: Record<string, unknown>
): LayerSummary[] {
  const scene = sceneContext.scene;
  if (typeof scene !== 'object' || scene === null) {
    return [];
  }
  const sceneRecord = scene as Record<string, unknown>;
  const pages = sceneRecord.pages;
  if (!Array.isArray(pages)) {
    return [];
  }

  const summaries: LayerSummary[] = [];
  for (const page of pages) {
    if (typeof page !== 'object' || page === null) {
      continue;
    }
    const pageRecord = page as Record<string, unknown>;
    if (Array.isArray(pageRecord.layers)) {
      collectLayers(pageRecord.layers, summaries);
    }
  }
  return summaries;
}

export function buildPageSummaries(
  sceneContext: Record<string, unknown>
): PageSummary[] {
  const scene = sceneContext.scene;
  if (typeof scene !== 'object' || scene === null) {
    return [];
  }
  const pages = (scene as Record<string, unknown>).pages;
  if (!Array.isArray(pages)) {
    return [];
  }

  return pages.flatMap((page) => {
    if (typeof page !== 'object' || page === null) {
      return [];
    }
    const record = page as Record<string, unknown>;
    const layers = Array.isArray(record.layers) ? record.layers : [];
    return [
      {
        id: String(record.id),
        ...(typeof record.name === 'string' ? { name: record.name } : {}),
        ...(typeof record.width === 'number' ? { width: record.width } : {}),
        ...(typeof record.height === 'number' ? { height: record.height } : {}),
        layerCount: layers.length,
      },
    ];
  });
}

/** Compact always-on scene context for the agent (no full scene JSON dump). */
export function formatSceneContext(
  sceneContext: Record<string, unknown>
): string {
  const layerSummary = buildLayerSummary(sceneContext);
  const pages = buildPageSummaries(sceneContext);
  const selection = sceneContext.selection;
  const activePageId = sceneContext.activePageId;

  return [
    'Compact scene summary (use exact layer IDs in proposals):',
    JSON.stringify(
      {
        activePageId: activePageId ?? null,
        pages,
        selection: selection ?? {},
        layers: layerSummary,
      },
      null,
      2
    ),
    '',
    'Call list-layers, get-layer, or get-page when you need full property values.',
  ].join('\n');
}

export function findLayerRecord(
  sceneContext: Record<string, unknown>,
  layerId: string
): Record<string, unknown> | null {
  const scene = sceneContext.scene;
  if (typeof scene !== 'object' || scene === null) {
    return null;
  }
  const pages = (scene as Record<string, unknown>).pages;
  if (!Array.isArray(pages)) {
    return null;
  }

  const stack: unknown[] = [];
  for (const page of pages) {
    if (typeof page === 'object' && page !== null) {
      const layers = (page as Record<string, unknown>).layers;
      if (Array.isArray(layers)) {
        stack.push(...layers);
      }
    }
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current !== 'object' || current === null) {
      continue;
    }
    const record = current as Record<string, unknown>;
    if (String(record.id) === layerId) {
      return record;
    }
    if (Array.isArray(record.children)) {
      stack.push(...record.children);
    }
    if (Array.isArray(record.layers)) {
      stack.push(...record.layers);
    }
    const data =
      typeof record.data === 'object' && record.data !== null
        ? (record.data as Record<string, unknown>)
        : {};
    if (Array.isArray(data.children)) {
      stack.push(...data.children);
    }
  }

  return null;
}

export function findPageRecord(
  sceneContext: Record<string, unknown>,
  pageId: string
): Record<string, unknown> | null {
  const scene = sceneContext.scene;
  if (typeof scene !== 'object' || scene === null) {
    return null;
  }
  const pages = (scene as Record<string, unknown>).pages;
  if (!Array.isArray(pages)) {
    return null;
  }
  for (const page of pages) {
    if (typeof page !== 'object' || page === null) {
      continue;
    }
    const record = page as Record<string, unknown>;
    if (String(record.id) === pageId) {
      return record;
    }
  }
  return null;
}
