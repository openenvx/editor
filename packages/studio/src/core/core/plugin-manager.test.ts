import { describe, expect, it } from 'vitest';

import { ContextKeyContribution } from '../contributions/context-key-contribution';
import { EditorRuntime } from '../core/editor-runtime';
import type { Plugin } from '../core/plugin';
import { PluginManager } from '../core/plugin-manager';
import type { CommandContext } from '../runtime/types';
import { SceneStore } from '../scene/scene-store';
import { EditorService } from '../workbench/editor-service';

class AlwaysTrueContextKey extends ContextKeyContribution {
  readonly key = 'test.alwaysTrue';

  evaluate(_ctx: CommandContext): boolean {
    return true;
  }
}

describe('PluginManager', () => {
  it('creates plugin context from the injected runtime', () => {
    const scene = new SceneStore();
    const editor = new EditorService();
    const runtime = new EditorRuntime(scene, editor);
    const manager = new PluginManager(runtime);
    const ctx = manager.createPluginContext();

    expect(ctx.scene).toBe(scene);
    expect(ctx.editor).toBe(editor);
    expect(ctx.services).toBe(runtime.services);
    expect(ctx.events).toBe(runtime.getEvents());
    expect(ctx.contextKeys).toBe(runtime.getContextKeys());
  });

  it('syncs plugin-registered context keys after activation', async () => {
    const scene = new SceneStore();
    const editor = new EditorService();
    const runtime = new EditorRuntime(scene, editor);
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
