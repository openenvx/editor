import type { SandboxCapability } from './sandbox/types';
import type { RenderNode } from './types';

export type ExtensionKind = 'canvas' | 'html';

export interface ExtensionCommandContribution {
  id: string;
  title: string;
  icon?: string;
  when?: string;
}

export interface ExtensionViewContainerContribution {
  id: string;
  title: string;
  icon?: string;
  /** Defaults to primary sidebar. */
  location?: 'sidebar' | 'secondary';
}

export interface ExtensionViewContribution {
  id: string;
  container: string;
  title?: string;
  when?: string;
}

/** Inspector field snapshot persisted on the widget layer / insert command. */
export interface ExtensionWidgetFieldDef {
  kind: string;
  label: string;
  options?: { label: string; value: string }[];
  of?: Record<string, ExtensionWidgetFieldDef>;
  [key: string]: unknown;
}

/** Declared widget / block face (Inspector fields may be filled at define time). */
export interface ExtensionWidgetContribution {
  id: string;
  label: string;
  icon?: string;
  kinds: ExtensionKind[];
  fields?: Record<string, ExtensionWidgetFieldDef>;
  defaults?: Record<string, unknown>;
}

/** Static chrome trees — same shape as former runtime panel:manifest. */
export interface ExtensionChromeContribution {
  menu?: RenderNode;
  toolbar?: RenderNode;
  statusBar?: RenderNode;
  palette?: RenderNode;
}

export interface ExtensionContributes {
  widgets?: ExtensionWidgetContribution[];
  /** HTML blocks — same shape as widgets with kinds including `html`. */
  blocks?: ExtensionWidgetContribution[];
  commands?: ExtensionCommandContribution[];
  viewContainers?: ExtensionViewContainerContribution[];
  views?: ExtensionViewContribution[];
  chrome?: ExtensionChromeContribution;
}

export type ExtensionActivationEvent =
  | `onWidget:${string}`
  | `onCommand:${string}`
  | `onView:${string}`
  | 'onStartup';

/**
 * Static extension contract. Authored typed via `defineExtension`, emitted as
 * `openenvx.extension.json`. Declares contributions; grants authorize.
 */
export interface ExtensionManifest {
  id: string;
  name: string;
  version?: string;
  activation?: ExtensionActivationEvent[];
  /** Requested capabilities — intersected with the host grant. */
  permissions?: SandboxCapability[];
  /**
   * Command ids the isolate may call via `executeCommand`.
   * Distinct from `contributes.commands` (UI commands the host registers).
   */
  requestedCommands?: string[];
  contributes: ExtensionContributes;
}

/** Alias kept for chrome mappers that used PluginPanelManifest. */
export type PluginPanelManifest = ExtensionChromeContribution;
