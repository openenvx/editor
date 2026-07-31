import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

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

import styles from './sandbox-ui-panel.module.css';

const PANEL_MARGIN = 16;

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

/** Clamp dragged panel origin inside the viewport (exported for unit checks). */
export function clampSandboxUiPanelPosition(
  left: number,
  top: number,
  width: number,
  height: number,
  viewport?: { width: number; height: number }
): { left: number; top: number } {
  const view = viewport ?? {
    width: typeof window === 'undefined' ? width : window.innerWidth,
    height: typeof window === 'undefined' ? height : window.innerHeight,
  };
  const maxLeft = Math.max(PANEL_MARGIN, view.width - width - PANEL_MARGIN);
  const maxTop = Math.max(PANEL_MARGIN, view.height - height - PANEL_MARGIN);
  return {
    left: Math.min(Math.max(PANEL_MARGIN, left), maxLeft),
    top: Math.min(Math.max(PANEL_MARGIN, top), maxTop),
  };
}

/** Renders into the sandbox extension createRoot host (already on document.body). */
export function SandboxUiPanel({
  controller,
}: {
  controller: SandboxExtensionController;
}): ReactNode {
  const titleId = useId();
  const [ui, setUi] = useState<SandboxUiState | null>(controller.getUiState());
  const [toasts, setToasts] = useState<SandboxNotifyEvent[]>([]);
  const [theme, setTheme] = useState(readDocumentTheme);
  const [context, setContext] = useState(() =>
    buildContext(
      controller,
      controller.getUiState()?.extensionId,
      readDocumentTheme()
    )
  );
  /** Null = CSS bottom-right dock; set only after the user drags. */
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<Window | null>(null);
  const outboundQueueRef = useRef<unknown[]>([]);
  const toastTimersRef = useRef<number[]>([]);
  const openKey = ui
    ? `${ui.extensionId}:${ui.layerId ?? ''}:${ui.html}`
    : null;
  const themeScope = { 'data-owb-theme': theme } as const;

  useEffect(() => controller.subscribeUi(setUi), [controller]);

  // New showUI (not resize) resets to the CSS default dock.
  useEffect(() => {
    setPosition(null);
  }, [openKey]);

  const dragged = position !== null;
  useEffect(() => {
    if (!ui || !dragged) {
      return;
    }
    const reclamp = () => {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      setPosition((prev) => {
        if (!prev) {
          return prev;
        }
        return clampSandboxUiPanelPosition(
          prev.left,
          prev.top,
          panel.offsetWidth,
          panel.offsetHeight
        );
      });
    };
    reclamp();
    window.addEventListener('resize', reclamp);
    return () => window.removeEventListener('resize', reclamp);
  }, [ui, ui?.width, ui?.height, dragged]);

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
    if (!openKey) {
      return;
    }
    // Focus host chrome on open so Esc works until the user returns to the canvas.
    panelRef.current?.focus();
  }, [openKey]);

  useEffect(() => {
    if (!ui) {
      frameRef.current = null;
      outboundQueueRef.current = [];
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      // Defer to real modal overlays (palette / confirm) when present.
      if (document.querySelector('[aria-modal="true"]')) {
        return;
      }
      const panel = panelRef.current;
      const active = document.activeElement;
      // Only when focus is in host chrome — not while the canvas (or other UI) owns keys.
      if (!(panel && active && panel.contains(active))) {
        return;
      }
      controller.closeUi(ui.extensionId, ui.layerId);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, ui]);

  const onHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !ui) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) {
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const rect = panel.getBoundingClientRect();
    const startLeft = position?.left ?? rect.left;
    const startTop = position?.top ?? rect.top;
    setPosition({ left: startLeft, top: startTop });
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startLeft,
      startTop,
    };
    setDragging(true);
  };

  const onHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !ui) {
      return;
    }
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? ui.width;
    const height = panel?.offsetHeight ?? ui.height;
    setPosition(
      clampSandboxUiPanelPosition(
        drag.startLeft + (event.clientX - drag.originX),
        drag.startTop + (event.clientY - drag.originY),
        width,
        height
      )
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    setDragging(false);
    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div {...themeScope}>
      {ui ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(styles.panel, position && styles.panelDragged)}
          style={
            position ? { left: position.left, top: position.top } : undefined
          }
        >
          <div
            className={cn(styles.header, dragging && styles.headerDragging)}
            data-testid="sandbox-ui-panel-header"
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <h2 className={styles.title} id={titleId}>
              {ui.extensionId}
            </h2>
            <div className={styles.actions}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => controller.stop(ui.extensionId, ui.layerId)}
              >
                Stop
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => controller.closeUi(ui.extensionId, ui.layerId)}
              >
                Close
              </Button>
            </div>
          </div>
          <SandboxUiFrame
            html={ui.html}
            width={ui.width}
            height={ui.height}
            context={context}
            onClose={() => controller.closeUi(ui.extensionId, ui.layerId)}
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
              controller.deliverUiMessage(ui.extensionId, ui.layerId, message);
            }}
          />
        </div>
      ) : null}
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
