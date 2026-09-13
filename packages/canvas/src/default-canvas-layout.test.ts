import { describe, expect, it } from 'vitest';

import { DEFAULT_CANVAS_LAYOUT } from './default-canvas-layout';

describe('DEFAULT_CANVAS_LAYOUT', () => {
  it('enables product top bar and bottom toolbars', () => {
    expect(DEFAULT_CANVAS_LAYOUT.topBar).toBe(true);
    expect(DEFAULT_CANVAS_LAYOUT.editorToolbars).toBe(true);
  });
});
