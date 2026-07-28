import type { PluginNode, PluginPanelContext } from './types';

export const PLUGIN_HOST_SOURCE = 'openenvx-embed';
export const PLUGIN_PARENT_SOURCE = 'openenvx-embed-parent';

/** Chrome trees an external parent may contribute via `panel:manifest`. */
export interface PluginPanelManifest {
  menu?: PluginNode;
  toolbar?: PluginNode;
  statusBar?: PluginNode;
  palette?: PluginNode;
}

export type HostToParentMessage =
  | {
      source: typeof PLUGIN_HOST_SOURCE;
      v: 1;
      type: 'panel:context';
      payload: PluginPanelContext;
    }
  | {
      source: typeof PLUGIN_HOST_SOURCE;
      v: 1;
      type: 'panel:event';
      payload: { panelId: string; handlerId: string; args?: unknown };
    };

export type ParentToHostMessage =
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'panel:tree';
      payload: { panelId: string; root: PluginNode };
    }
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'panel:command';
      payload: { panelId: string; commandId: string; args?: unknown };
    }
  | {
      source: typeof PLUGIN_PARENT_SOURCE;
      v: 1;
      type: 'panel:manifest';
      payload: { panelId: string; manifest: PluginPanelManifest };
    };

export type PluginPanelMessage = HostToParentMessage | ParentToHostMessage;
