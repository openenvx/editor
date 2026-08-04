import { describe, expect, it } from 'vitest';

import type { Page } from '@openenvx/schema';

import { resolveStageClickAction } from './resolve-stage-click-selection';

const page: Page = {
  id: 'p1',
  name: 'P',
  layout: 'html',
  layers: [
    {
      id: 'root-1',
      type: 'html.root',
      data: { children: [] },
    },
  ],
};

describe('resolveStageClickAction', () => {
  it('selects root when the click is inside the artboard', () => {
    const artboard = document.createElement('div');
    artboard.dataset.testid = 'html-artboard';
    const child = document.createElement('span');
    artboard.append(child);
    expect(
      resolveStageClickAction({
        target: child,
        artboardTestId: 'html-artboard',
        page,
      })
    ).toEqual({ type: 'select', layerId: 'root-1' });
  });

  it('clears when the click is outside the artboard', () => {
    const stage = document.createElement('div');
    expect(
      resolveStageClickAction({
        target: stage,
        artboardTestId: 'html-artboard',
        page,
      })
    ).toEqual({ type: 'clear' });
  });
});
