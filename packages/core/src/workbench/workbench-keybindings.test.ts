import type { EditorRuntime, Registries } from '../backbone';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachWorkbenchKeybindings } from './workbench-keybindings';

describe(attachWorkbenchKeybindings, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ignores shortcuts while focus is in an editable field', async () => {
    const handleKeyDown = vi.fn(async () => true);
    const listeners: {
      keydown: ((event: KeyboardEvent) => void) | null;
    } = { keydown: null };

    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;

    const windowStub = {
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject
      ) => {
        if (type === 'keydown' && typeof listener === 'function') {
          listeners.keydown = listener as (event: KeyboardEvent) => void;
        }
      },
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;

    globalThis.window = windowStub;
    globalThis.document = {
      activeElement: { isContentEditable: false, tagName: 'INPUT' },
    } as unknown as Document;

    try {
      const detach = attachWorkbenchKeybindings(
        {
          commands: {} as Registries['commands'],
          keybindings: { handleKeyDown },
        } as unknown as Registries,
        {
          createCommandContext: () => ({}),
          getContextKeys: () => ({ evaluate: () => true }),
          getEvents: () => ({}),
        } as unknown as EditorRuntime
      );

      expect(listeners.keydown).toBeTypeOf('function');
      listeners.keydown?.({
        altKey: false,
        ctrlKey: false,
        key: 'v',
        metaKey: true,
        preventDefault: vi.fn(),
        shiftKey: false,
        target: { isContentEditable: false, tagName: 'INPUT' },
      } as unknown as KeyboardEvent);

      await Promise.resolve();
      expect(handleKeyDown).not.toHaveBeenCalled();

      detach?.();
    } finally {
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
    }
  });

  it('dispatches shortcuts when focus is a non-typing input', async () => {
    const handleKeyDown = vi.fn(async () => true);
    const listeners: {
      keydown: ((event: KeyboardEvent) => void) | null;
    } = { keydown: null };

    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;

    const windowStub = {
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject
      ) => {
        if (type === 'keydown' && typeof listener === 'function') {
          listeners.keydown = listener as (event: KeyboardEvent) => void;
        }
      },
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;

    globalThis.window = windowStub;
    globalThis.document = {
      activeElement: {
        isContentEditable: false,
        tagName: 'INPUT',
        type: 'checkbox',
      },
    } as unknown as Document;

    try {
      const detach = attachWorkbenchKeybindings(
        {
          commands: {} as Registries['commands'],
          keybindings: { handleKeyDown },
        } as unknown as Registries,
        {
          createCommandContext: () => ({}),
          getContextKeys: () => ({ evaluate: () => true }),
          getEvents: () => ({}),
        } as unknown as EditorRuntime
      );

      listeners.keydown?.({
        altKey: false,
        ctrlKey: false,
        key: 'z',
        metaKey: true,
        preventDefault: vi.fn(),
        shiftKey: false,
        target: {
          isContentEditable: false,
          tagName: 'INPUT',
          type: 'checkbox',
        },
      } as unknown as KeyboardEvent);

      await Promise.resolve();
      expect(handleKeyDown).toHaveBeenCalledOnce();

      detach?.();
    } finally {
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
    }
  });
});
