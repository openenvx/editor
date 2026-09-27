import { describe, expect, test } from 'bun:test';

import { shellDropdownMenuItemId } from './shell-dropdown';

describe('shellDropdownMenuItemId', () => {
  test('disambiguates repeated commandId via args', () => {
    const dropdownId = 'canvas-toolbar-grid-size';
    const commandId = 'canvas.setGridSize';
    const ids = [4, 8, 16].map((size) =>
      shellDropdownMenuItemId(
        dropdownId,
        { commandId, args: { size }, label: `${size}px` },
        0
      )
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('falls back to index when commandId alone is ambiguous', () => {
    const dropdownId = 'zoom';
    const commandId = 'canvas.zoomIn';
    expect(
      shellDropdownMenuItemId(dropdownId, { commandId }, 0)
    ).toBe('zoom-canvas.zoomIn-0');
    expect(
      shellDropdownMenuItemId(dropdownId, { commandId }, 1)
    ).toBe('zoom-canvas.zoomIn-1');
  });
});
