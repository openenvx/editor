import { Command, isLayoutRootLayer } from '@openenvx/core';
import type { CommandContext, ServiceId } from '@openenvx/core';

import type { BlockRegistry } from '../block-registry';
import {
  cloneBlockWithNewIds,
  createBlock,
  findBlock,
  insertAt,
  mapPageLayers,
  moveTo,
  removeById,
  siblingCount,
  updateBlockData,
} from '../tree/block-tree';

export interface BlockCommandSetOptions {
  /** Command id prefix, e.g. `html` → `html.insertBlock`. */
  prefix: string;
  /** Preferred root layer type (also any `*.root` is protected). */
  rootType: string;
  registryServiceId: ServiceId<BlockRegistry>;
  /**
   * When set, mutate commands only accept layers whose type starts with this
   * prefix (e.g. `email.`).
   */
  typePrefix?: string;
  /** When set, mutate commands require `page.layout === pageLayout`. */
  pageLayout?: string;
}

function createBlockId(type: string): string {
  return `${type.replaceAll('.', '-')}-${crypto.randomUUID()}`;
}

function getBlockRegistry(
  ctx: CommandContext,
  registryServiceId: ServiceId<BlockRegistry>
): BlockRegistry | null {
  if (!ctx.services.has(registryServiceId)) {
    return null;
  }
  return ctx.services.get(registryServiceId);
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

function resolveTargetId(
  ctx: CommandContext,
  args?: { id?: string }
): string | null {
  if (args?.id) {
    return args.id;
  }
  return (
    ctx.selection.primaryLayerId ?? ctx.selection.selectedLayerIds[0] ?? null
  );
}

/** Build insert/move/duplicate/update/remove commands for a block driver. */
export function createBlockCommands(
  options: BlockCommandSetOptions
): Command[] {
  const { prefix, rootType, registryServiceId, typePrefix, pageLayout } =
    options;

  function isDriverPage(ctx: CommandContext): boolean {
    if (!pageLayout) {
      return true;
    }
    return ctx.scene.getActivePage().layout === pageLayout;
  }

  function isDriverBlockType(type: string): boolean {
    if (!typePrefix) {
      return true;
    }
    return type.startsWith(typePrefix);
  }

  function isRemovableBlock(ctx: CommandContext, id: string): boolean {
    if (!isDriverPage(ctx)) {
      return false;
    }
    const page = ctx.scene.getActivePage();
    const found = findBlock(page.layers, id);
    return Boolean(
      found &&
      !isLayoutRootLayer(found.block) &&
      isDriverBlockType(found.block.type)
    );
  }

  function canMoveSibling(
    ctx: CommandContext,
    args: { id?: string } | undefined,
    direction: 'up' | 'down'
  ): boolean {
    if (!isDriverPage(ctx)) {
      return false;
    }
    const id = resolveTargetId(ctx, args);
    if (!id) {
      return false;
    }
    const page = ctx.scene.getActivePage();
    const found = findBlock(page.layers, id);
    if (
      !found ||
      isLayoutRootLayer(found.block) ||
      !isDriverBlockType(found.block.type)
    ) {
      return false;
    }
    if (direction === 'up') {
      return found.index > 0;
    }
    return found.index < siblingCount(page.layers, found.parentId) - 1;
  }

  function moveSibling(
    ctx: CommandContext,
    args: { id?: string } | undefined,
    direction: 'up' | 'down'
  ): void {
    if (!canMoveSibling(ctx, args, direction)) {
      return;
    }
    const id = resolveTargetId(ctx, args);
    if (!id) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const found = findBlock(page.layers, id);
    if (!found) {
      return;
    }
    const nextIndex = direction === 'up' ? found.index - 1 : found.index + 1;
    if (nextIndex < 0) {
      return;
    }
    ctx.scene.apply({
      apply: (scene) =>
        mapPageLayers(scene, page.id, (layers) =>
          moveTo(layers, id, found.parentId, nextIndex)
        ),
      label: direction === 'up' ? 'Move block up' : 'Move block down',
    });
  }

  return [
    new (class extends Command {
      readonly id = `${prefix}.insertBlock`;

      execute(
        ctx: CommandContext,
        args?: {
          type?: string;
          parentId?: string | null;
          index?: number;
        }
      ): void {
        if (!isDriverPage(ctx)) {
          return;
        }
        const type = args?.type;
        if (!type || !isDriverBlockType(type)) {
          return;
        }
        const registry = getBlockRegistry(ctx, registryServiceId);
        if (!registry) {
          return;
        }
        const config = registry.get(type);
        if (!config || type.endsWith('.root') || type === rootType) {
          return;
        }
        const page = ctx.scene.getActivePage();
        const parentId = args?.parentId ?? null;
        if (!parentAcceptsChildren(registry, page.layers, parentId)) {
          return;
        }
        const index = args?.index ?? Number.POSITIVE_INFINITY;
        const block = createBlock(
          type,
          createBlockId(type),
          config.defaultData
        );
        ctx.scene.apply({
          apply: (scene) =>
            mapPageLayers(scene, page.id, (layers) =>
              insertAt(layers, parentId, block, index)
            ),
          label: 'Insert block',
        });
        ctx.scene.selectLayers([block.id]);
      }
    })(),
    new (class extends Command {
      readonly id = `${prefix}.moveBlock`;

      execute(
        ctx: CommandContext,
        args?: {
          id?: string;
          newParentId?: string | null;
          index?: number;
        }
      ): void {
        if (!isDriverPage(ctx)) {
          return;
        }
        const id = args?.id;
        if (!id) {
          return;
        }
        const registry = getBlockRegistry(ctx, registryServiceId);
        if (!registry) {
          return;
        }
        const page = ctx.scene.getActivePage();
        const found = findBlock(page.layers, id);
        if (
          !found ||
          isLayoutRootLayer(found.block) ||
          !isDriverBlockType(found.block.type)
        ) {
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
    })(),
    new (class extends Command {
      readonly id = `${prefix}.moveBlockUp`;

      canExecute(ctx: CommandContext, args?: { id?: string }): boolean {
        return canMoveSibling(ctx, args, 'up');
      }

      execute(ctx: CommandContext, args?: { id?: string }): void {
        moveSibling(ctx, args, 'up');
      }
    })(),
    new (class extends Command {
      readonly id = `${prefix}.moveBlockDown`;

      canExecute(ctx: CommandContext, args?: { id?: string }): boolean {
        return canMoveSibling(ctx, args, 'down');
      }

      execute(ctx: CommandContext, args?: { id?: string }): void {
        moveSibling(ctx, args, 'down');
      }
    })(),
    new (class extends Command {
      readonly id = `${prefix}.duplicateBlock`;

      canExecute(ctx: CommandContext, args?: { id?: string }): boolean {
        const id = resolveTargetId(ctx, args);
        return id !== null && isRemovableBlock(ctx, id);
      }

      execute(ctx: CommandContext, args?: { id?: string }): void {
        const id = resolveTargetId(ctx, args);
        if (!id || !isRemovableBlock(ctx, id)) {
          return;
        }
        const page = ctx.scene.getActivePage();
        const found = findBlock(page.layers, id);
        if (!found) {
          return;
        }
        const clone = cloneBlockWithNewIds(found.block, createBlockId);
        ctx.scene.apply({
          apply: (scene) =>
            mapPageLayers(scene, page.id, (layers) =>
              insertAt(layers, found.parentId, clone, found.index + 1)
            ),
          label: 'Duplicate block',
        });
        ctx.scene.selectLayers([clone.id]);
      }
    })(),
    new (class extends Command {
      readonly id = `${prefix}.updateBlockData`;

      execute(
        ctx: CommandContext,
        args?: { id?: string; patch?: Record<string, unknown> }
      ): void {
        if (!isDriverPage(ctx)) {
          return;
        }
        const id = args?.id;
        const patch = args?.patch;
        if (!(id && patch)) {
          return;
        }
        const page = ctx.scene.getActivePage();
        const found = findBlock(page.layers, id);
        if (!found || !isDriverBlockType(found.block.type)) {
          return;
        }
        ctx.scene.apply({
          apply: (scene) =>
            mapPageLayers(scene, page.id, (layers) =>
              updateBlockData(layers, id, patch)
            ),
          label: 'Update block',
        });
      }
    })(),
    new (class extends Command {
      readonly id = `${prefix}.removeBlock`;

      canExecute(ctx: CommandContext, args?: { id?: string }): boolean {
        const id = resolveTargetId(ctx, args);
        return id !== null && isRemovableBlock(ctx, id);
      }

      execute(ctx: CommandContext, args?: { id?: string }): void {
        const id = resolveTargetId(ctx, args);
        if (!id || !isRemovableBlock(ctx, id)) {
          return;
        }
        const page = ctx.scene.getActivePage();
        ctx.scene.apply({
          apply: (scene) =>
            mapPageLayers(scene, page.id, (layers) => removeById(layers, id)),
          label: 'Remove block',
        });
        ctx.scene.selectLayers([]);
      }
    })(),
  ];
}
