import {
  SANDBOX_HOST_UI_SOURCE,
  type SandboxHostUiMessage,
} from '@xmazu/openenvxee-extensions/protocol';

/** Host → opaque-origin showUI iframe (`targetOrigin` must be `'*'`). */
export function postHostUiMessage(
  frame: Window,
  message: SandboxHostUiMessage
): void {
  frame.postMessage(message, '*');
}

/** Isolate → iframe pluginMessage. */
export function postSandboxUiMessage(
  frame: Window,
  pluginMessage: unknown
): void {
  postHostUiMessage(frame, {
    source: SANDBOX_HOST_UI_SOURCE,
    v: 1,
    type: 'ui:message',
    pluginMessage,
  });
}
