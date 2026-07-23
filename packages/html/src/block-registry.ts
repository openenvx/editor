import { createServiceId } from '@openenvx/core';

import type { BlockConfig } from './block-config';

export class BlockRegistry {
  private readonly configs = new Map<string, BlockConfig>();

  register(config: BlockConfig): void {
    this.configs.set(config.type, config);
  }

  get(type: string): BlockConfig | undefined {
    return this.configs.get(type);
  }

  getAll(): BlockConfig[] {
    return [...this.configs.values()];
  }

  /** Palette entries — skip synthetic root. */
  getPaletteBlocks(): BlockConfig[] {
    return this.getAll().filter((c) => c.type !== 'html.root');
  }
}

/** Shared catalog used by the plugin, commands, and React palette/pane. */
export const defaultBlockRegistry = new BlockRegistry();

export const BlockRegistryServiceId =
  createServiceId<BlockRegistry>('html.BlockRegistry');
