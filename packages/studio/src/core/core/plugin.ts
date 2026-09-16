import type { PluginContext } from './plugin-manager';

export abstract class Plugin {
  abstract readonly id: string;

  abstract activate(ctx: PluginContext): void | Promise<void>;

  deactivate?(ctx: PluginContext): void | Promise<void>;
}
