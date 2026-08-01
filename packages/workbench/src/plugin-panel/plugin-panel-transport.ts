import type {
  HostToParentMessage,
  ParentToHostMessage,
} from '@openenvx/protocol';

/** Pluggable message pipe between the Studio panel host and the tree emitter. */
export interface PluginPanelTransport {
  send(message: HostToParentMessage): void;
  subscribe(handler: (message: ParentToHostMessage) => void): () => void;
}
