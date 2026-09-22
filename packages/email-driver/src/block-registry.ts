import { BlockRegistry } from '@openenvx/html-driver';
import { createServiceId } from '@openenvx/studio';

/** Shared catalog for the email driver (plugin, commands, palette, pane). */
export const emailBlockRegistry = new BlockRegistry();

export const EmailBlockRegistryServiceId = createServiceId<BlockRegistry>(
  'email.BlockRegistry'
);
