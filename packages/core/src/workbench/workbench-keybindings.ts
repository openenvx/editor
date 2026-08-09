import type { EditorRuntime, Registries } from '../backbone';
import { isTypingTarget } from '../utils/is-typing-target';

function shouldIgnoreEditableShortcut(event: KeyboardEvent): boolean {
  const activeTarget =
    event.target && typeof event.target === 'object'
      ? event.target
      : typeof document !== 'undefined'
        ? document.activeElement
        : null;

  return isTypingTarget(activeTarget);
}

export function attachWorkbenchKeybindings(
  coreRegistries: Registries,
  runtime: EditorRuntime
): (() => void) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const handler = (event: KeyboardEvent) => {
    if (shouldIgnoreEditableShortcut(event)) {
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
