import {
  SANDBOX_UI_SOURCE,
  type SandboxUiMessage,
} from '@xmazu/openenvxee-plugin-protocol';
import { useEffect, useRef } from 'react';

export interface PluginUiFrameProps {
  html: string;
  width: number;
  height: number;
  onMessage?: (message: unknown) => void;
  onClose?: () => void;
}

export function PluginUiFrame({
  html,
  width,
  height,
  onMessage,
  onClose,
}: PluginUiFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onWindowMessage = (event: MessageEvent) => {
      const frame = iframeRef.current?.contentWindow;
      if (!frame || event.source !== frame) {
        return;
      }
      const data = event.data as SandboxUiMessage | null;
      if (!data || data.source !== SANDBOX_UI_SOURCE || data.v !== 1) {
        return;
      }
      if (data.type === 'ui:close') {
        onClose?.();
        return;
      }
      if (data.type === 'ui:message') {
        onMessage?.(data.pluginMessage);
      }
    };
    window.addEventListener('message', onWindowMessage);
    return () => window.removeEventListener('message', onWindowMessage);
  }, [onClose, onMessage]);

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8" />
<script>
window.parent.postMessage({ source: '${SANDBOX_UI_SOURCE}', v: 1, type: 'ui:ready' }, '*');
window.onmessage = function (event) {
  // Host → UI messages reserved for later (selection push, theme).
};
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
      title="OpenEnvX plugin UI"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{
        width,
        height,
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        background: '#111',
      }}
    />
  );
}
