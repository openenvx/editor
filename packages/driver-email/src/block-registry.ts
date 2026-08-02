import { createServiceId } from '@openenvx/core';
import { BlockRegistry } from '@openenvx/html';

/** Shared catalog for the email driver (plugin, commands, palette, pane). */
export const emailBlockRegistry = new BlockRegistry();

export const EmailBlockRegistryServiceId = createServiceId<BlockRegistry>(
  'email.BlockRegistry'
);
