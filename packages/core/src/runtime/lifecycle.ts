import type { Plugin } from '../core/plugin';

export class Lifecycle {
  private readonly activated = new Map<string, Plugin>();

  isActivated(id: string): boolean {
    return this.activated.has(id);
  }

  markActivated(plugin: Plugin): void {
    this.activated.set(plugin.id, plugin);
  }

  markDeactivated(id: string): Plugin | undefined {
    const plugin = this.activated.get(id);
    this.activated.delete(id);
    return plugin;
  }
}
