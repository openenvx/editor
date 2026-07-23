import { Command } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import { BlockRegistryServiceId, type BlockRegistry } from '../block-registry';
import {
  createBlock,
  findBlock,
  insertAt,
  mapPageLayers,
  moveTo,
  removeById,
  updateBlockData,
} from '../tree/block-tree';

function createBlockId(type: string): string {
  return `${type.replaceAll('.', '-')}-${crypto.randomUUID()}`;
}

function getBlockRegistry(ctx: CommandContext): BlockRegistry | null {
  if (!ctx.services.has(BlockRegistryServiceId)) {
    return null;
  }
  return ctx.services.get(BlockRegistryServiceId);
}

function parentAcceptsChildren(
  registry: BlockRegistry,
  layers: Parameters<typeof findBlock>[0],
  parentId: string | null
): boolean {
  if (parentId === null) {
    return true;
  }
  const parent = findBlock(layers, parentId);
  if (!parent) {
    return false;
  }
  return registry.get(parent.block.type)?.acceptsChildren === true;
}

export class InsertHtmlBlockCommand extends Command {
  readonly id = 'html.insertBlock';

  execute(
    ctx: CommandContext,
    args?: {
      type?: string;
      parentId?: string | null;
      index?: number;
    }
  ): void {
    const type = args?.type;
    if (!type) {
      return;
    }
    const registry = getBlockRegistry(ctx);
    if (!registry) {
      return;
    }
    const config = registry.get(type);
    if (!config || type === 'html.root') {
      return;
    }
    const page = ctx.scene.getActivePage();
    const parentId = args?.parentId ?? null;
    if (!parentAcceptsChildren(registry, page.layers, parentId)) {
      return;
    }
    const index = args?.index ?? Number.POSITIVE_INFINITY;
    const block = createBlock(type, createBlockId(type), config.defaultData);
    ctx.scene.apply({
      apply: (scene) =>
        mapPageLayers(scene, page.id, (layers) =>
          insertAt(layers, parentId, block, index)
        ),
      label: 'Insert block',
    });
    ctx.scene.selectLayers([block.id]);
  }
}

export class MoveHtmlBlockCommand extends Command {
  readonly id = 'html.moveBlock';

  execute(
    ctx: CommandContext,
    args?: {
      id?: string;
      newParentId?: string | null;
      index?: number;
    }
  ): void {
    const id = args?.id;
    if (!id) {
      return;
    }
    const registry = getBlockRegistry(ctx);
    if (!registry) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const found = findBlock(page.layers, id);
    if (!found || found.block.type === 'html.root') {
      return;
    }
    const newParentId = args?.newParentId ?? null;
    if (!parentAcceptsChildren(registry, page.layers, newParentId)) {
      return;
    }
    const index = args?.index ?? 0;
    ctx.scene.apply({
      apply: (scene) =>
        mapPageLayers(scene, page.id, (layers) =>
          moveTo(layers, id, newParentId, index)
        ),
      label: 'Move block',
    });
  }
}

export class UpdateHtmlBlockDataCommand extends Command {
  readonly id = 'html.updateBlockData';

  execute(
    ctx: CommandContext,
    args?: { id?: string; patch?: Record<string, unknown> }
  ): void {
    const id = args?.id;
    const patch = args?.patch;
    if (!(id && patch)) {
      return;
    }
    const page = ctx.scene.getActivePage();
    ctx.scene.apply({
      apply: (scene) =>
        mapPageLayers(scene, page.id, (layers) =>
          updateBlockData(layers, id, patch)
        ),
      label: 'Update block',
    });
  }
}

export class RemoveHtmlBlockCommand extends Command {
  readonly id = 'html.removeBlock';

  execute(ctx: CommandContext, args?: { id?: string }): void {
    const id = args?.id;
    if (!id) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const found = findBlock(page.layers, id);
    if (!found || found.block.type === 'html.root') {
      return;
    }
    ctx.scene.apply({
      apply: (scene) =>
        mapPageLayers(scene, page.id, (layers) => removeById(layers, id)),
      label: 'Remove block',
    });
    ctx.scene.selectLayers([]);
  }
}
