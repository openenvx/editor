import { describe, expect, it } from 'vitest';

import { mergePrimaryContainerOrder } from './merge-primary-container-order';

describe('mergePrimaryContainerOrder', () => {
  it('keeps dropdown/command slots while reordering panels', () => {
    const containers = [
      { id: 'pages', sidebarBehavior: 'panel' },
      { id: 'cmd', sidebarBehavior: 'command' },
      { id: 'layers', sidebarBehavior: 'panel' },
    ];
    expect(mergePrimaryContainerOrder(containers, ['layers', 'pages'])).toEqual(
      ['layers', 'cmd', 'pages']
    );
  });
});
