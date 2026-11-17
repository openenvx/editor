import { describe, expect, it } from 'vitest';

import { ContextKeyContribution } from '../contributions/context-key-contribution';
import type { Plugin } from '../runtime/plugin';
import { PluginManager } from '../runtime/plugin-manager';
import { WorkbenchRuntime } from '../runtime/workbench-runtime';
import type { CommandContext } from '../runtime/types';

class AlwaysTrueContextKey extends ContextKeyContribution {
  readonly key = 'test.alwaysTrue';

  evaluate(_ctx: CommandContext): boolean {
    return true;
  }
}

describe('PluginManager', () => {
  it('creates plugin context from the injected runtime', () => {
    const runtime = new WorkbenchRuntime();
    const manager = new PluginManager(runtime);
    const ctx = manager.createPluginContext();

    expect(ctx.services).toBe(runtime.services);
    expect(ctx.events).toBe(runtime.getEvents());
    expect(ctx.contextKeys).toBe(runtime.getContextKeys());
  });

  it('syncs plugin-registered context keys after activation', async () => {
    const runtime = new WorkbenchRuntime();
    const manager = new PluginManager(runtime);
    const plugin: Plugin = {
      id: 'test.context-key',
      activate(ctx) {
        ctx.register(new AlwaysTrueContextKey());
      },
    };

    await manager.activate(plugin);

    expect(runtime.getContextKeys().evaluate('test.alwaysTrue')).toBe(true);
  });
});