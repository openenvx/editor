/**
 * Runtime exports for in-package imports (workbench subtree).
 * Avoids importing the main barrel while `index.ts` re-exports headless.
 */
export { Command } from './contributions/command';
export { Plugin } from './runtime/plugin';
export type { PluginContext } from './runtime/plugin-manager';
export { WorkbenchRuntime } from './runtime/workbench-runtime';
export type { WorkbenchRuntime as EditorRuntime } from './runtime/workbench-runtime';
export { Registry } from './registries/registry';
export type { Registries } from './registries/registries';
export { createContributionBuildContext } from './i18n/localize';
export type { ContributionBuildContext } from './i18n/localize';
export type { CommandContext } from './runtime/types';
export {
  createDefaultInteractionState,
  type InteractionState,
} from './runtime/interaction-state';
export type { ExternalStore } from './runtime/external-store';
export { Emitter, type Event } from './runtime/emitter';
export { createServiceId } from './runtime/create-service-id';
export {
  createPopupFieldsBuilder,
  createPropertyBuilder,
  type FieldAction,
  type NumericFieldConfig,
  type PopupFieldsBuilder,
  type PropertyFieldDescriptor,
  type PropertySectionDescriptor,
} from './builders/property-builder';
export type { EditorViewportApi } from './workbench/editor-viewport-api';
export { WorkbenchEvents } from './runtime/workbench-events';
export type { WorkbenchSliceContext } from './state/workbench-slice-context';
export type {
  SceneSlice,
  EditorSlice,
  ChromeSlice,
  CommandsSlice,
  InteractionSlice,
  SliceBuilders,
} from './workbench/workbench-state-cache';
export { buildViewContainer } from './state/view-descriptor-builder';
