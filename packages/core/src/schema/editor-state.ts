import type { EditorState, Layer, Page, Scene } from './types';

function layerExistsOnPage(page: Page, layerId: string): boolean {
  let exists = false;

  function walk(layers: Layer[]): void {
    for (const layer of layers) {
      if (layer.id === layerId) {
        exists = true;
        return;
      }
      const data = layer.data;
      if (
        data &&
        typeof data === 'object' &&
        'children' in data &&
        Array.isArray((data as { children: unknown }).children)
      ) {
        walk((data as { children: Layer[] }).children);
      }
    }
  }

  walk(page.layers ?? []);
  return exists;
}

/** Drop selection references to layers/pages that no longer exist. */
export function pruneEditorState(
  scene: Scene,
  editorState: EditorState
): EditorState {
  const fallbackPageId = scene.pages[0]?.id;
  if (!fallbackPageId) {
    return editorState;
  }

  const activePageId = scene.pages.some(
    (p) => p.id === editorState.activePageId
  )
    ? editorState.activePageId
    : fallbackPageId;
  const page = scene.pages.find((p) => p.id === activePageId)!;
  const selectedLayerIds = editorState.selectedLayerIds.filter((id) =>
    layerExistsOnPage(page, id)
  );
  const primaryLayerId =
    editorState.primaryLayerId &&
    selectedLayerIds.includes(editorState.primaryLayerId)
      ? editorState.primaryLayerId
      : (selectedLayerIds[0] ?? null);

  return { activePageId, primaryLayerId, selectedLayerIds };
}
