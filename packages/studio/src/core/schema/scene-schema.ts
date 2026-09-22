/**
 * @deprecated Import from `./document-schema` instead.
 * Re-exports the document Zod schemas under legacy scene names.
 */
export {
  documentSchemaCanonical as sceneSchemaCanonical,
  documentSchemaLenient as sceneSchemaLenient,
  editorSessionSchemaCanonical,
  editorSessionSchemaLenient,
  frameSchema,
  leafSchemas,
  nodeStyleShadowSchema as layerStyleShadowSchema,
  paddingSchema,
  projectSnapshotSchemaCanonical as sceneSnapshotSchemaCanonical,
  projectSnapshotSchemaLenient as sceneSnapshotSchemaLenient,
  frameSchema as transformSchema,
} from './document-schema';
