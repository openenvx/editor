import { describe, expect, it } from 'vitest';

import { Emitter } from './emitter';

describe('Emitter', () => {
  it('notifies subscribers and supports unsubscribe', () => {
    const emitter = new Emitter<number>();
    const values: number[] = [];

    const subscription = emitter.event((value) => {
      values.push(value);
    });

    emitter.fire(1);
    emitter.fire(2);
    subscription.dispose();
    emitter.fire(3);

    expect(values).toEqual([1, 2]);
  });
});
