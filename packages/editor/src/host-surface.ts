/** Headless exports for sandbox / embed hosts (no React plugin graph). */
export { DocumentStore } from './scene/document-store';
export type { DocumentTransaction } from './scene/types';
export { DocumentStoreServiceId } from './tokens';
export {
  getDocumentStore,
  requireDocumentStore,
} from './document-store-access';
export {
  findNodeById,
  getChildNodes,
  insertNodeIntoContainer,
  mapNodes,
  moveNodeRelativeToTarget,
  updateNodeInTree,
  walkNodes,
} from './scene/layer-tree';
export { MIN_LAYER_SIZE } from './scene/transform-utils';
export { getActiveArtboard } from './scene/types';
export { updateNodeByIdInDocument } from './scene/layer-tree';
