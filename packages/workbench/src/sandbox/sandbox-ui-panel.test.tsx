import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  SandboxExtensionController,
  SandboxNotifyEvent,
  SandboxUiState,
} from './sandbox-extension-controller';
import {
  clampSandboxUiPanelPosition,
  SandboxUiPanel,
} from './sandbox-ui-panel';

afterEach(cleanup);

function createControllerStub(initial: SandboxUiState | null = null): {
  controller: SandboxExtensionController;
  setUi: (state: SandboxUiState | null) => void;
  closeUi: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
} {
  let uiState = initial;
  const uiListeners = new Set<(state: SandboxUiState | null) => void>();
  const closeUi = vi.fn((_extensionId?: string, _layerId?: string) => {
    uiState = null;
    for (const listener of uiListeners) {
      listener(null);
    }
  });
  const stop = vi.fn();

  const controller = {
    getUiState: () => uiState,
    subscribeUi: (listener: (state: SandboxUiState | null) => void) => {
      uiListeners.add(listener);
      return () => {
        uiListeners.delete(listener);
      };
    },
    subscribeNotify: (_listener: (event: SandboxNotifyEvent) => void) => () => {},
    subscribeUiOutbound: (_listener: (message: unknown) => void) => () => {},
    subscribeUiContext: (_listener: () => void) => () => {},
    getUiContextSelection: () => null,
    closeUi,
    stop,
    deliverUiMessage: vi.fn(),
  } as unknown as SandboxExtensionController;

  return {
    controller,
    setUi: (state) => {
      uiState = state;
      for (const listener of uiListeners) {
        listener(state);
      }
    },
    closeUi,
    stop,
  };
}

const sampleUi: SandboxUiState = {
  extensionId: 'demo.plugin',
  html: '<p>hello</p>',
  width: 320,
  height: 200,
  kind: 'plugin',
};

describe('clampSandboxUiPanelPosition', () => {
  it('keeps the panel inside the viewport margin', () => {
    expect(
      clampSandboxUiPanelPosition(900, 700, 320, 200, {
        width: 800,
        height: 600,
      })
    ).toEqual({ left: 464, top: 384 });
    expect(
      clampSandboxUiPanelPosition(-40, -20, 320, 200, {
        width: 800,
        height: 600,
      })
    ).toEqual({ left: 16, top: 16 });
  });
});

describe('SandboxUiPanel', () => {
  it('renders a non-modal dialog without a backdrop', () => {
    const { controller } = createControllerStub(sampleUi);
    const { container } = render(<SandboxUiPanel controller={controller} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('false');
    expect(screen.getByText('demo.plugin')).toBeTruthy();
    expect(container.querySelector('[class*="backdrop"]')).toBeNull();
    expect(dialog.style.left).toBe('');
    expect(dialog.style.top).toBe('');
  });

  it('does not close on pointer down outside the panel', () => {
    const { controller, closeUi } = createControllerStub(sampleUi);
    render(<SandboxUiPanel controller={controller} />);

    fireEvent.pointerDown(document.body, { button: 0 });
    expect(closeUi).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('closes on Close button', () => {
    const { controller, closeUi } = createControllerStub(sampleUi);
    render(<SandboxUiPanel controller={controller} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closeUi).toHaveBeenCalledWith('demo.plugin', undefined);
  });

  it('closes on Escape when the dialog has focus', () => {
    const { controller, closeUi } = createControllerStub(sampleUi);
    render(<SandboxUiPanel controller={controller} />);

    const dialog = screen.getByRole('dialog');
    dialog.focus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeUi).toHaveBeenCalledWith('demo.plugin', undefined);
  });

  it('does not close on window Escape when focus is outside the panel', () => {
    const { controller, closeUi } = createControllerStub(sampleUi);
    render(<SandboxUiPanel controller={controller} />);

    // Blur the auto-focused dialog so canvas-style focus wins.
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeUi).not.toHaveBeenCalled();
  });

  it('moves the panel when dragging the title bar', () => {
    const { controller } = createControllerStub(sampleUi);
    render(<SandboxUiPanel controller={controller} />);

    const dialog = screen.getByRole('dialog');
    const header = screen.getByTestId('sandbox-ui-panel-header');
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 200,
      left: 100,
      top: 200,
      width: 320,
      height: 248,
      right: 420,
      bottom: 448,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(header, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(header, {
      clientX: 140,
      clientY: 160,
      pointerId: 1,
    });
    fireEvent.pointerUp(header, { pointerId: 1 });

    expect(Number.parseFloat(dialog.style.left || '0')).toBe(140);
    expect(Number.parseFloat(dialog.style.top || '0')).toBe(260);
  });
});
