import type { EditorRuntime, Registries } from '@openenvx/core';

function shouldIgnoreDeleteShortcut(event: KeyboardEvent): boolean {
  if (event.key !== 'Delete' && event.key !== 'Backspace') {
    return false;
  }

  const activeTarget =
    event.target && typeof event.target === 'object'
      ? event.target
      : typeof document !== 'undefined'
        ? document.activeElement
        : null;

  return isEditableKeyTarget(activeTarget);
}

function isEditableKeyTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const element = target as {
    getAttribute?: (name: string) => string | null;
    isContentEditable?: boolean;
    tagName?: string;
  };

  if (element.isContentEditable) {
    return true;
  }

  const tagName = element.tagName?.toUpperCase();
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  return element.getAttribute?.('contenteditable') === 'true';
}

export function attachWorkbenchKeybindings(
  coreRegistries: Registries,
  runtime: EditorRuntime
): (() => void) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const handler = (event: KeyboardEvent) => {
    if (shouldIgnoreDeleteShortcut(event)) {
      return;
    }
    const evaluateWhen = (when: string | undefined) =>
      runtime.getContextKeys().evaluate(when);
    const ctx = runtime.createCommandContext();
    coreRegistries.keybindings.handleKeyDown(
      event,
      coreRegistries.commands,
      ctx,
      runtime.getEvents(),
      evaluateWhen
    );
  };

  window.addEventListener('keydown', handler);
  return () => {
    window.removeEventListener('keydown', handler);
  };
}
