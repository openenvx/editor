import { describe, expect, it } from 'vitest';

import { WorkbenchRuntime } from '../runtime/workbench-runtime';
import { WorkbenchEvents } from '../runtime/workbench-events';

describe('WorkbenchRuntime events', () => {
  it('emits context change events through the bus', () => {
    const runtime = new WorkbenchRuntime();
    const events = runtime.getEvents();
    let contextChangeCount = 0;

    events.on(WorkbenchEvents.DidChangeContext, () => {
      contextChangeCount += 1;
    });

    runtime.getContextKeys().setContext('test.workbench', true);

    expect(contextChangeCount).toBeGreaterThan(0);
  });

  it('disposes event listeners and context keys', () => {
    const runtime = new WorkbenchRuntime();
    const events = runtime.getEvents();
    let contextChangeCount = 0;

    events.on(WorkbenchEvents.DidChangeContext, () => {
      contextChangeCount += 1;
    });

    runtime.dispose();
    runtime.getContextKeys().setContext('test.afterDispose', true);

    expect(contextChangeCount).toBe(0);
  });
});