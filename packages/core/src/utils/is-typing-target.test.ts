import { describe, expect, it } from 'vitest';

import { isTypingTarget } from './is-typing-target';

describe(isTypingTarget, () => {
  it('treats text-like inputs as typing targets', () => {
    expect(
      isTypingTarget({ isContentEditable: false, tagName: 'INPUT', type: 'text' })
    ).toBe(true);
    expect(
      isTypingTarget({ isContentEditable: false, tagName: 'INPUT', type: 'url' })
    ).toBe(true);
    expect(
      isTypingTarget({ isContentEditable: false, tagName: 'TEXTAREA' })
    ).toBe(true);
    expect(isTypingTarget({ isContentEditable: false, tagName: 'SELECT' })).toBe(
      true
    );
  });

  it('does not treat checkbox/radio/button inputs as typing targets', () => {
    expect(
      isTypingTarget({
        isContentEditable: false,
        tagName: 'INPUT',
        type: 'checkbox',
      })
    ).toBe(false);
    expect(
      isTypingTarget({ isContentEditable: false, tagName: 'INPUT', type: 'radio' })
    ).toBe(false);
    expect(
      isTypingTarget({
        isContentEditable: false,
        tagName: 'INPUT',
        type: 'button',
      })
    ).toBe(false);
  });
});
