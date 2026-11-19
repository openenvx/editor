import {
  createEditorPlugins,
  createEmptyEditorPlugins,
  DocumentStoreServiceId,
  updateNodeByIdInDocument,
  type DocumentStore,
} from '@openenvx/editor';
import type { DocumentNode, ProjectSnapshot } from '@openenvx/editor/schema';

import type { Plugin } from '#studio';

import { WorkbenchController } from '../workbench/workbench-controller';

/** Workbench with document services and default editor plugins only. */
export function createEmptyWorkbench(
  extraPlugins: Plugin[] = []
): WorkbenchController {
  const { plugins, sliceBuilders } = createEmptyEditorPlugins();
  return new WorkbenchController({
    plugins: [...plugins, ...extraPlugins],
    sliceBuilders,
  });
}

/** Boot a controller with document services for studio package tests. */
export function createWorkbenchWithEditor(
  snapshot: ProjectSnapshot,
  extraPlugins: Plugin[] = []
): WorkbenchController {
  const { plugins, sliceBuilders } = createEditorPlugins({
    document: snapshot.document,
    session: snapshot.session,
  });
  return new WorkbenchController({
    plugins: [...plugins, ...extraPlugins],
    sliceBuilders,
  });
}

export function requireTestDocumentStore(
  controller: WorkbenchController
): DocumentStore {
  const store = controller.api.getService(DocumentStoreServiceId);
  if (!store) {
    throw new Error('DocumentStore is not registered');
  }
  return store;
}

/** Test-only property update (layer `props` top-level keys). */
export function updateTestLayerProperty(
  controller: WorkbenchController,
  layerId: string,
  key: string,
  value: unknown
): void {
  const store = requireTestDocumentStore(controller);
  store.apply({
    label: 'test.updateProperty',
    apply: (document) =>
      updateNodeByIdInDocument(document, layerId, (node) => ({
        ...node,
        props: { ...(node.props as Record<string, unknown>), [key]: value },
      })),
  });
}

export function selectTestNodes(
  controller: WorkbenchController,
  nodeIds: string[],
  primaryNodeId?: string | null
): void {
  requireTestDocumentStore(controller).selectNodes(
    nodeIds,
    primaryNodeId ?? nodeIds[0] ?? null
  );
}

export function getTestPrimaryNode(
  controller: WorkbenchController
): DocumentNode | null {
  return requireTestDocumentStore(controller).getPrimaryNode();
}
