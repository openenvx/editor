const NON_TYPING_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function isTypingInputType(type: string | null | undefined): boolean {
  return !NON_TYPING_INPUT_TYPES.has((type ?? 'text').toLowerCase());
}

/**
 * True when keyboard/clipboard should stay with the focused control
 * (text-like inputs, textarea, select, contenteditable) — not editor shortcuts.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  if (typeof Element !== 'undefined' && target instanceof Element) {
    if (target.closest('[contenteditable="true"], [contenteditable=""]')) {
      return true;
    }
    if (target.closest('textarea, select')) {
      return true;
    }
    const input = target.closest('input');
    if (!input) {
      return false;
    }
    return isTypingInputType(input.getAttribute('type'));
  }

  const element = target as {
    getAttribute?: (name: string) => string | null;
    isContentEditable?: boolean;
    tagName?: string;
    type?: string;
  };

  if (
    element.isContentEditable ||
    element.getAttribute?.('contenteditable') === 'true'
  ) {
    return true;
  }

  const tagName = element.tagName?.toUpperCase();
  if (tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }
  if (tagName === 'INPUT') {
    return isTypingInputType(element.type ?? element.getAttribute?.('type'));
  }

  return false;
}
