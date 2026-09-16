export {
  VersionHistoryPlugin,
  VERSION_HISTORY_CONTAINER_ID,
  VERSION_HISTORY_VIEW_ID,
  VERSION_HISTORY_PANEL_COMPONENT_ID,
  VERSION_HISTORY_PLUGIN_ID,
  type VersionHistoryPluginOptions,
} from './version-history-plugin';
export { VersionHistoryPanel } from './version-history-panel';
export {
  RestoreVersionCommand,
  VERSION_HISTORY_RESTORE_COMMAND_ID,
  type RestoreVersionArgs,
} from './restore-version-command';
export type {
  DocumentVersion,
  VersionAuthor,
  VersionHistoryProvider,
} from '../../core/version-history/version-history-types';
export { VersionHistoryProviderId } from '../../core/version-history/version-history-service-id';
