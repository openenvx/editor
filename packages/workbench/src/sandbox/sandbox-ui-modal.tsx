import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { DEFAULT_THEME } from '../context/theme-definitions';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';
import type {
  SandboxExtensionController,
  SandboxNotifyEvent,
  SandboxUiState,
} from './sandbox-extension-controller';
import { SandboxUiFrame } from './sandbox-ui-frame';
import { postSandboxUiMessage } from './sandbox-ui-protocol';

import overlaySurface from '../primitives/overlay-surface.module.css';
import styles from './sandbox-ui-modal.module.css';

function readDocumentTheme(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }
  const scoped = document.querySelector('[data-owb-theme]');
  const attr = scoped?.dataset.owbTheme?.trim();
  return attr || DEFAULT_THEME;
}

function toUiTheme(theme: string): 'light' | 'dark' {
  return theme === 'light' ? 'light' : 'dark';
}

function buildContext(
  controller: SandboxExtensionController,
  extensionId: string | undefined,
  theme: string
) {
  const selection = extensionId
    ? controller.getUiContextSelection(extensionId)
    : null;
  return {
    theme: toUiTheme(theme),
    ...(selection ? { selection } : {}),
  };
}

/** Renders into the sandbox extension createRoot host (already on document.body). */
export function SandboxUiModal({
  controller,
}: {
  controller: SandboxExtensionController;
}): ReactNode {
  const [ui, setUi] = useState<SandboxUiState | null>(controller.getUiState());
  const [toasts, setToasts] = useState<SandboxNotifyEvent[]>([]);
  const [theme, setTheme] = useState(readDocumentTheme);
  /** Keep last open UI mounted so Radix Presence can play the exit animation. */
  const [retainedUi, setRetainedUi] = useState<SandboxUiState | null>(ui);
  const [context, setContext] = useState(() =>
    buildContext(
      controller,
      controller.getUiState()?.extensionId,
      readDocumentTheme()
    )
  );
  const frameRef = useRef<Window | null>(null);
  const outboundQueueRef = useRef<unknown[]>([]);
  const toastTimersRef = useRef<number[]>([]);
  const themeScope = { 'data-owb-theme': theme } as const;
  const open = ui !== null;
  const activeUi = ui ?? retainedUi;

  useEffect(() => controller.subscribeUi(setUi), [controller]);

  useEffect(() => {
    if (ui) {
      setRetainedUi(ui);
    }
  }, [ui]);

  useEffect(() => {
    const sync = () => setTheme(readDocumentTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-owb-theme'],
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  useEffect(
    () =>
      controller.subscribeNotify((event) => {
        setToasts((prev) => [...prev.slice(-4), event]);
        const timer = window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== event.id));
          toastTimersRef.current = toastTimersRef.current.filter(
            (id) => id !== timer
          );
        }, 3200);
        toastTimersRef.current.push(timer);
      }),
    [controller]
  );

  useEffect(
    () => () => {
      for (const timer of toastTimersRef.current) {
        window.clearTimeout(timer);
      }
      toastTimersRef.current = [];
    },
    []
  );

  useEffect(
    () =>
      controller.subscribeUiOutbound((pluginMessage) => {
        const frame = frameRef.current;
        if (frame) {
          postSandboxUiMessage(frame, pluginMessage);
          return;
        }
        outboundQueueRef.current.push(pluginMessage);
      }),
    [controller]
  );

  useEffect(() => {
    const refresh = () => {
      setContext(buildContext(controller, ui?.extensionId, theme));
    };
    refresh();
    return controller.subscribeUiContext(refresh);
  }, [controller, theme, ui?.extensionId]);

  useEffect(() => {
    if (!ui) {
      frameRef.current = null;
      outboundQueueRef.current = [];
    }
  }, [ui]);

  return (
    <div {...themeScope}>
      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && ui) {
            controller.closeUi(ui.extensionId, ui.layerId);
          }
        }}
      >
        <Dialog.Portal>
          <div className={styles.portal} {...themeScope}>
            <Dialog.Overlay
              className={cn(styles.backdrop, overlaySurface.backdrop)}
            />
            {activeUi ? (
              <Dialog.Content
                aria-describedby={undefined}
                className={cn(styles.dialog, overlaySurface.surface)}
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <div className={styles.header}>
                  <Dialog.Title className={styles.title}>
                    {activeUi.extensionId}
                  </Dialog.Title>
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        controller.stop(activeUi.extensionId, activeUi.layerId)
                      }
                    >
                      Stop
                    </Button>
                    <Dialog.Close asChild>
                      <Button size="sm" variant="ghost">
                        Close
                      </Button>
                    </Dialog.Close>
                  </div>
                </div>
                <SandboxUiFrame
                  html={activeUi.html}
                  width={activeUi.width}
                  height={activeUi.height}
                  context={context}
                  onClose={() =>
                    controller.closeUi(activeUi.extensionId, activeUi.layerId)
                  }
                  onFrameWindow={(frame) => {
                    frameRef.current = frame;
                    if (!frame) {
                      return;
                    }
                    const queued = outboundQueueRef.current;
                    outboundQueueRef.current = [];
                    for (const pluginMessage of queued) {
                      postSandboxUiMessage(frame, pluginMessage);
                    }
                  }}
                  onMessage={(message) => {
                    controller.deliverUiMessage(
                      activeUi.extensionId,
                      activeUi.layerId,
                      message
                    );
                  }}
                />
              </Dialog.Content>
            ) : null}
          </div>
        </Dialog.Portal>
      </Dialog.Root>
      {toasts.length > 0 ? (
        <div className={styles.toastStack} aria-live="polite">
          {toasts.map((toast) => (
            <div className={styles.toast} key={toast.id} role="status">
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
