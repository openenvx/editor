import { describe, expect, it } from 'vitest';

import { formatShortcut, isAppleShortcutPlatform } from './format-shortcut';

describe('formatShortcut', () => {
  it('maps Mod/Shift/Alt/Delete to Apple glyphs on Apple hosts', () => {
    expect(formatShortcut('Mod+Shift+Z', true)).toBe('⌘⇧Z');
    expect(formatShortcut('Mod+Alt+Delete', true)).toBe('⌘⌥⌫');
    expect(formatShortcut('Backspace', true)).toBe('⌫');
  });

  it('maps Mod to Ctrl+ on non-Apple hosts', () => {
    expect(formatShortcut('Mod+Shift+Z', false)).toBe('Ctrl+Shift+Z');
    expect(formatShortcut('Mod+Alt+Delete', false)).toBe('Ctrl+Alt+Delete');
    expect(formatShortcut('Backspace', false)).toBe('Del');
  });
});

describe('isAppleShortcutPlatform', () => {
  it('detects Mac and iOS platform strings', () => {
    expect(isAppleShortcutPlatform('MacIntel', '')).toBe(true);
    expect(isAppleShortcutPlatform('iPhone', '')).toBe(true);
    expect(isAppleShortcutPlatform('Win32', 'Windows NT 10.0')).toBe(false);
    expect(isAppleShortcutPlatform('Linux x86_64', 'X11; Linux')).toBe(false);
  });
});
