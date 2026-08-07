/**
 * Render a keybinding descriptor (`Mod+Shift+Z`) the way a native menu would
 * show it. Apple hosts get glyphs (`⌘⇧Z`); others get `Ctrl+Shift+Z`.
 */
export function isAppleShortcutPlatform(
  platform = typeof navigator === 'undefined' ? '' : navigator.platform,
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
): boolean {
  return (
    /Mac|iPhone|iPad|iPod/i.test(platform) ||
    /Mac OS X|iPhone|iPad/.test(userAgent)
  );
}

export function formatShortcut(
  shortcut: string,
  apple = isAppleShortcutPlatform()
): string {
  if (apple) {
    return shortcut
      .replaceAll('Mod+', '⌘')
      .replaceAll('Shift+', '⇧')
      .replaceAll('Alt+', '⌥')
      .replaceAll('Delete', '⌫')
      .replaceAll('Backspace', '⌫');
  }
  return shortcut.replaceAll('Mod+', 'Ctrl+').replaceAll('Backspace', 'Del');
}
