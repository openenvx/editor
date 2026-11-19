import {
  DocumentStoreServiceId,
  updateNodeByIdInDocument,
  type DocumentStore,
  type Document,
  type EditorSession,
} from '@openenvx/editor';
import { nodeProps } from '@openenvx/editor/schema';
import { writeLayerDataAtKey } from '@openenvx/studio';
import type { WorkbenchApi } from '@openenvx/studio';

export function requireCanvasDocumentStore(api: WorkbenchApi): DocumentStore {
  const store = api.getService(DocumentStoreServiceId);
  if (!store) {
    throw new Error('DocumentStore is not registered');
  }
  return store;
}

export function selectNodesViaApi(
  api: WorkbenchApi,
  layerIds: string[],
  primaryNodeId?: string | null
): void {
  requireCanvasDocumentStore(api).selectNodes(
    layerIds,
    primaryNodeId ?? layerIds[0] ?? null
  );
}

export function updatePropertyViaApi(
  api: WorkbenchApi,
  layerId: string,
  key: string,
  value: unknown
): void {
  const store = requireCanvasDocumentStore(api);
  store.apply({
    label: 'property.update',
    apply: (document) =>
      updateNodeByIdInDocument(document, layerId, (node) => {
        const data = nodeProps(node) as Record<string, unknown>;
        return {
          ...node,
          props: writeLayerDataAtKey(data, key, value),
        };
      }),
  });
}

export function readWorkbenchDocument(api: WorkbenchApi): Document {
  return requireCanvasDocumentStore(api).getDocument();
}

export function readWorkbenchSelection(api: WorkbenchApi): EditorSession {
  return requireCanvasDocumentStore(api).getSession();
}

export function setWorkbenchDocument(
  api: WorkbenchApi,
  document: Document
): void {
  requireCanvasDocumentStore(api).setDocument(document);
}

export function getWorkbenchContentRevision(api: WorkbenchApi): number {
  return requireCanvasDocumentStore(api).getContentRevision();
}
