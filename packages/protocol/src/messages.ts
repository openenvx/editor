import type { ExtensionManifest } from './extension-manifest';
import type { PluginPanelContext, RenderNode } from './types';

export const PLUGIN_HOST_SOURCE = 'openenvx-embed';
export const PLUGIN_PARENT_SOURCE = 'openenvx-embed-parent';

/** Chrome trees (static manifest or legacy naming). */
export type { PluginPanelManifest } from './extension-manifest';

/**
 * Lane-neutral messages (parent page ↔ host, or isolate ↔ host via bridge).
 * `surfaceId` names a panel, view, or other contributed surface.
 */
export type ParentToHostMessage =
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'render';
      payload: { surfaceId: string; root: RenderNode };
    }
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'command';
      payload: { surfaceId: string; commandId: string; args?: unknown };
    }
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'extension:manifest';
      payload: { extensionId: string; manifest: ExtensionManifest };
    }
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'widget:source';
      payload: { extensionId: string; source: string };
    };

export type HostToParentMessage =
  | {
      source: typeof PLUGIN_HOST_SOURCE;
      v: 1;
      type: 'context';
      payload: PluginPanelContext;
    }
  | {
      source: typeof PLUGIN_HOST_SOURCE;
      v: 1;
      type: 'invoke';
      payload: { surfaceId: string; handlerId: string; args?: unknown };
    }
  | {
      source: typeof PLUGIN_HOST_SOURCE;
      v: 1;
      type: 'widget:ready';
      payload: {
        extensionId: string;
        blockIds: string[];
        error?: string;
      };
    };

export type PluginPanelMessage = HostToParentMessage | ParentToHostMessage;
