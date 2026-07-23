export { SceneValidationError } from './scene/scene-validation-error';
export { escapeAttr, escapeHtml, sanitizeHtml } from './utils/html-utils';
export { ContributionPoint } from './core/contribution-point';
export { Contribution } from './core/contribution';
export { Plugin } from './core/plugin';
export { PluginManager, type PluginContext } from './core/plugin-manager';
export { EditorRuntime } from './core/editor-runtime';

export { Command } from './contributions/command';
export { LayerDefinition } from './contributions/layer-definition';
export { PageRulesContribution } from './contributions/page-rules-contribution';
export { ShortcutContribution } from './contributions/shortcut-contribution';
export { ContextKeyContribution } from './contributions/context-key-contribution';
export {
  ServiceContribution,
  SimpleServiceContribution,
  SingletonServiceContribution,
} from './contributions/service-contribution';

export {
  SceneStore,
  moveLayerToIndex,
  reorderLayers,
  type PageRulesLookup,
} from './scene/scene-store';
export { HistoryStack } from './scene/history-stack';
export type {
  EditorState,
  Layer,
  Page,
  PageLayout,
  Scene,
  SceneSnapshot,
  SceneTransaction,
  Selection,
  Transform,
  EditorPaneKind,
} from './scene/types';
export {
  cloneEditorState,
  cloneScene,
  getActivePage,
  getPrimaryLayer,
  resolveEditorPaneKind,
} from './scene/types';
export {
  buildFrozenLayerSnapshot,
  canDeleteLayer,
  canDuplicateLayer,
  canEditLayerData,
  canInsertLayers,
  canReorderLayer,
  canResizePage,
  canSelectLayer,
  canTransformLayer,
  getLayerWriteMode,
  isLayerEditable,
  isLayerLocked,
  isLayerVisible,
  isLayerWritable,
} from './scene/layer-editability';
export { clampTransformSize, MIN_LAYER_SIZE } from './scene/transform-utils';
export {
  CONTAINER_LAYER_TYPE,
  type ContainerLayoutModel,
  cloneLayerTree,
  createLayerId,
  findLayerById,
  findLayerPage,
  getLayerAncestorIds,
  getContainerChildren,
  getLayerChildren,
  hasChildLayers,
  insertLayerIntoContainer,
  isContainerLayer,
  layerExistsOnPage,
  mapLayers,
  findLayerLocation,
  moveLayerInTree,
  moveLayerRelativeToTarget,
  isLayerDescendant,
  removeLayerFromTree,
  updateLayerInTree,
  walkLayers,
} from './scene/layer-tree';
export {
  createBlankPageLike,
  createPageId,
  duplicatePageModel,
  movePageRelativeToTarget,
} from './scene/page-ops';

export { CommandService } from './runtime/command-service';
export type { CommandExecutionResult } from './runtime/command-result';
export { KeybindingService } from './runtime/keybinding-service';
export { Lifecycle } from './runtime/lifecycle';
export {
  DisposableStore,
  Emitter,
  type Event,
  type Disposable,
} from './runtime/emitter';
export {
  WorkbenchEventService,
  WorkbenchEvents,
  type EventBus,
  type WorkbenchEventName,
  type WorkbenchEventPayloads,
} from './runtime/workbench-events';
export {
  createDefaultInteractionState,
  type InteractionState,
} from './runtime/interaction-state';
export type { ExternalStore } from './runtime/external-store';
export {
  createServiceId,
  getServiceDebugName,
  inject,
  type ServiceId,
} from './runtime/create-service-id';
export {
  InstantiationService,
  InstantiationServiceId,
  type ServiceContainer,
  type ServiceFactory,
} from './runtime/instantiation-service';
export {
  createServicesAccessor,
  type ServicesAccessor,
} from './runtime/services-accessor';
export { type CommandContext } from './runtime/types';

export {
  PropertyBuilder,
  createPropertyBuilder,
  createPopupFieldsBuilder,
  PopupFieldsBuilder,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_PADDING,
  DEFAULT_SHADOW,
  normalizeCornerRadius,
  normalizePadding,
  uniformCornerRadius,
  uniformPadding,
  type PropertyFieldDescriptor,
  type PropertyFieldOption,
  type PropertyFieldKind,
  type PropertySectionDescriptor,
  type RepeaterFieldConfig,
  type FieldAction,
  type FieldActionClick,
  type FieldConfigOptions,
  type NumericFieldConfig,
  type PopupFieldConfig,
  type CornerRadiusValue,
  type PaddingValue,
  type ShadowValue,
} from './builders/property-builder';
export { type LayerPreviewContext } from './contributions/layer-preview-context';

export { I18nContribution } from './i18n/i18n-contribution';
export { I18nBundleRegistry } from './i18n/i18n-bundle-registry';
export {
  LocalizationServiceImpl,
  type LocalizationService,
  type LocalizeOptions,
  type LocalizationBundleOptions,
} from './i18n/localization-service';
export { LocalizationServiceId } from './i18n/localization-service-id';
export {
  localize,
  createContributionBuildContext,
  type ContributionBuildContext,
} from './i18n/localize';

export { CoreI18nPlugin } from './plugins/core-i18n-plugin';
export { ScenePlugin } from './plugins/scene-plugin';
export {
  Registries,
  LayerRegistry,
  registerContribution,
} from './registries/registries';
export { Registry, type RegistryDuplicatePolicy } from './registries/registry';

export {
  ContextKeyService,
  createContextKeyService,
} from './workbench/context-key-service';
export { EditorService, type EditorInput } from './workbench/editor-service';
export type { EditorViewportApi } from './workbench/editor-viewport-api';
export {
  EditorHostKeys,
  type EditorHostViewport,
} from './workbench/editor-host-keys';
export {
  EditorViewportServiceId,
  EditorViewportServiceImpl,
  type EditorViewportService,
} from './workbench/editor-viewport-service';
export { ThemeServiceId } from './workbench/theme-service-id';
export { ThemeServiceImpl, type ThemeService } from './workbench/theme-service';
export { IconRegistryId } from './workbench/icon-registry-service-id';
export {
  IconRegistryImpl,
  type IconRegistry,
} from './workbench/icon-registry-service';
export { DocumentHostServiceId } from './workbench/document-host-service-id';
export {
  MutableDocumentHostService,
  type DocumentHostService,
  type DocumentHostBindings,
  type DocumentHostConfiguration,
} from './workbench/document-host-service';
export { DocumentOperationsServiceId } from './workbench/document-operations-service-id';
export { type DocumentOperationsService } from './workbench/document-operations-service';

export {
  type MenuChoice,
  type MenuChoiceBindings,
  type MenuChoiceProvider,
} from './menu/menu-choice';
export { MutableMenuChoiceProvider } from './menu/mutable-menu-choice-provider';
export {
  MenuChoiceRegistryId,
  MenuChoiceRegistryImpl,
  type MenuChoiceRegistry,
} from './menu/menu-choice-registry';

export {
  AssetServiceId,
  ContextKeyServiceId,
  EditorServiceId,
  LayerRegistryServiceId,
  PersistenceServiceId,
  SceneStoreServiceId,
} from './tokens';
export { InMemoryAssetService } from './services/asset-service';
export { collectAssetRefs } from './services/collect-asset-refs';
export { InMemoryPersistenceService } from './services/in-memory-persistence-service';
export { LocalStoragePersistenceService } from './services/local-storage-persistence-service';
export type {
  AssetService,
  FontDescriptor,
  FontService,
  PersistenceService,
} from './services/types';
