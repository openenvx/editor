import {
  SANDBOX_HOST_UI_SOURCE,
  SANDBOX_UI_SOURCE,
  type SandboxHostUiMessage,
  type SandboxUiMessage,
  type SandboxUiSelection,
} from '@openenvx/protocol';
import { useEffect, useRef } from 'react';

import { postHostUiMessage } from './sandbox-ui-protocol';

import styles from './sandbox-ui-frame.module.css';

export interface SandboxUiFrameProps {
  html: string;
  width: number;
  height: number;
  onMessage?: (message: unknown) => void;
  onClose?: () => void;
  /** Called when the iframe window is available (and cleared on unmount). */
  onFrameWindow?: (frame: Window | null) => void;
  /** Pushed after iframe signals ui:ready (and whenever props change while open). */
  context?: {
    theme: 'light' | 'dark';
    selection?: SandboxUiSelection;
  };
}

function isValidUiMessage(data: unknown): data is SandboxUiMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const message = data as SandboxUiMessage;
  return (
    message.source === SANDBOX_UI_SOURCE &&
    message.v === 1 &&
    (message.type === 'ui:message' ||
      message.type === 'ui:ready' ||
      message.type === 'ui:close')
  );
}

/**
 * Sandboxed extension UI iframe.
 * `sandbox="allow-scripts"` without `allow-same-origin` → opaque (null) origin,
 * so iframe↔parent `postMessage` must use `'*'` as targetOrigin.
 * Size/JSON policy is enforced by SandboxExtensionController.
 */
export function SandboxUiFrame({
  html,
  width,
  height,
  onMessage,
  onClose,
  onFrameWindow,
  context,
}: SandboxUiFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const onCloseRef = useRef(onClose);
  const onFrameWindowRef = useRef(onFrameWindow);
  const contextRef = useRef(context);
  onMessageRef.current = onMessage;
  onCloseRef.current = onClose;
  onFrameWindowRef.current = onFrameWindow;
  contextRef.current = context;

  useEffect(() => {
    const onWindowMessage = (event: MessageEvent) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame || event.source !== frame) {
        return;
      }
      if (!isValidUiMessage(event.data)) {
        return;
      }
      const data = event.data;
      if (data.type === 'ui:close') {
        onCloseRef.current?.();
        return;
      }
      if (data.type === 'ui:ready') {
        readyRef.current = true;
        onFrameWindowRef.current?.(frame);
        const ctx = contextRef.current;
        if (ctx) {
          const message: SandboxHostUiMessage = {
            source: SANDBOX_HOST_UI_SOURCE,
            v: 1,
            type: 'ui:context',
            theme: ctx.theme,
            ...(ctx.selection ? { selection: ctx.selection } : {}),
          };
          postHostUiMessage(frame, message);
        }
        return;
      }
      if (data.type === 'ui:message') {
        onMessageRef.current?.(data.pluginMessage);
      }
    };
    window.addEventListener('message', onWindowMessage);
    return () => {
      window.removeEventListener('message', onWindowMessage);
      readyRef.current = false;
      onFrameWindowRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!(frame && readyRef.current && context)) {
      return;
    }
    const message: SandboxHostUiMessage = {
      source: SANDBOX_HOST_UI_SOURCE,
      v: 1,
      type: 'ui:context',
      theme: context.theme,
      ...(context.selection ? { selection: context.selection } : {}),
    };
    postHostUiMessage(frame, message);
  }, [context]);

  // Opaque-origin iframe: targetOrigin must be '*'.
  // addEventListener (not window.onmessage) so author HTML cannot clobber the bridge.
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8" />
<script>
window.parent.postMessage({ source: '${SANDBOX_UI_SOURCE}', v: 1, type: 'ui:ready' }, '*');
window.addEventListener('message', function (event) {
  if (event.source !== window.parent) {
    return;
  }
  var data = event.data;
  if (!data || data.source !== '${SANDBOX_HOST_UI_SOURCE}' || data.v !== 1) {
    return;
  }
  if (data.type === 'ui:message' && typeof window.onPluginMessage === 'function') {
    window.onPluginMessage(data.pluginMessage);
  }
  if (data.type === 'ui:context' && typeof window.onPluginContext === 'function') {
    window.onPluginContext({ theme: data.theme, selection: data.selection });
  }
});
window.closePluginUI = function () {
  window.parent.postMessage({ source: '${SANDBOX_UI_SOURCE}', v: 1, type: 'ui:close' }, '*');
};
window.postPluginMessage = function (pluginMessage) {
  window.parent.postMessage({
    source: '${SANDBOX_UI_SOURCE}',
    v: 1,
    type: 'ui:message',
    pluginMessage: pluginMessage,
  }, '*');
};
</script></head><body style="margin:0;font:14px/1.4 system-ui,sans-serif">${html}</body></html>`;

  return (
    <iframe
      ref={iframeRef}
      title="OpenEnvX sandbox UI"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className={styles.frame}
      style={{ width, height }}
    />
  );
}
