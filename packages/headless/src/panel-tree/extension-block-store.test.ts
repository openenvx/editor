import { describe, expect, it } from 'vitest';

import { extensionBlockStore } from './extension-block-store';

describe('extensionBlockStore', () => {
  it('registers and disposes palette entries', () => {
    extensionBlockStore.clear();
    const dispose = extensionBlockStore.register({
      id: 'wm.countdown',
      label: 'Countdown',
      insertCommandId: 'wm.countdown.insert',
    });
    expect(extensionBlockStore.getSnapshot()).toEqual([
      {
        id: 'wm.countdown',
        label: 'Countdown',
        insertCommandId: 'wm.countdown.insert',
      },
    ]);
    dispose.dispose();
    expect(extensionBlockStore.getSnapshot()).toEqual([]);
  });
});
