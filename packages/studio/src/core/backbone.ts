/**
 * Runtime exports for in-package imports (workbench subtree).
 * Avoids importing the main barrel while `index.ts` re-exports headless.
 */
export { Command } from './contributions/command';
export { LayerDefinition } from './contributions/layer-definition';
export { Plugin } from './core/plugin';
export type { PluginContext } from './core/plugin-manager';
export { EditorRuntime } from './core/editor-runtime';
export { PluginManager } from './core/plugin-manager';
export { Registry } from './registries/registry';
export { Registries } from './registries/registries';
export { SceneStore } from './scene/scene-store';
export type { Layer, Scene, Selection, EditorState } from './scene/types';
export { createContributionBuildContext } from './i18n/localize';
export type { ContributionBuildContext } from './i18n/localize';
export type { CommandContext } from './runtime/types';
export type { CommandExecutionResult } from './runtime/command-result';
export {
  createDefaultInteractionState,
  type InteractionState,
} from './runtime/interaction-state';
export type { ExternalStore } from './runtime/external-store';
export { Emitter, type Event } from './runtime/emitter';
export { createServiceId, type ServiceId } from './runtime/create-service-id';
export {
  PropertyBuilder,
  type PropertyFieldDescriptor,
  type PropertySectionDescriptor,
} from './builders/property-builder';
export { InMemoryAssetService } from './services/asset-service';
export { AssetServiceId } from './tokens';
export type { EditorViewportApi } from './workbench/editor-viewport-api';
export {
  createPopupFieldsBuilder,
  PopupFieldsBuilder,
  type FieldAction,
  type FieldActionClick,
  type NumericFieldConfig,
  type PropertyFieldOption,
} from './builders/property-builder';
export {
  getLayerChildrenForScene,
  resolveInstanceDefinitionLayers,
} from './scene/expand-instances';
export { resolveEditorPaneKind } from './scene/types';
export {
  findLayerById,
  moveLayerRelativeToTarget,
  walkLayers,
} from './scene/layer-tree';
export {
  getLayerWriteMode,
  isLayerShownInLayers,
} from './scene/layer-editability';
export type { SceneTransaction } from './scene/types';
export type { LayerPreviewContext } from './contributions/layer-preview-context';
export type { Page } from './scene/types';
export { WorkbenchEvents } from './runtime/workbench-events';
export type { IconRegistry } from './workbench/icon-registry-service';
export { createPropertyBuilder } from './builders/property-builder';
