/** Locks overlay popup chrome to Synara's frosted menu recipe. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(import.meta.dirname, 'overlay-surface.module.css'),
  'utf-8'
);

describe('Synara overlay popup chrome', () => {
  it('paints frost from overlay-surface + popup-blur at 2xl radius', () => {
    expect(css).toContain('var(--app-overlay-surface)');
    expect(css).toContain('var(--app-overlay-backing, transparent)');
    expect(css).toContain('blur(40px) saturate(150%)');
    expect(css).toContain('rounded-2xl');
    expect(css).toContain('.popupCompact');
  });
});
