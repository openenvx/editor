import {
  Command,
  canInsertLayers,
  canTransformLayer,
  cloneNodeTree,
  findNodeById,
  localize,
  getLayerChildren,
} from '@openenvx/studio/core';
import type { CommandContext, DocumentNode } from '@openenvx/studio/core';
import type { DocumentComponent } from '@openenvx/studio/schema';
import {
  applyNodeTransform,
  createDefaultTransform,
  nodeTransform,
} from '@openenvx/studio/schema';

import { createGroupFromLayers } from '../scene/group-layers';

function createComponentId(): string {
  return `component-${crypto.randomUUID()}`;
}

function createInstanceId(): string {
  return `instance-${crypto.randomUUID()}`;
}

/** Create a component from the current selection and replace it with an instance. */
export class CreateComponentFromSelectionCommand extends Command {
  readonly id = 'canvas.createComponent';

  canExecute(ctx: CommandContext): boolean {
    if (!canInsertLayers(ctx.scene.getDocument())) {
      return false;
    }
    const ids = ctx.selection.selectedNodeIds;
    if (ids.length === 0) {
      return false;
    }
    const scene = ctx.scene.getDocument();
    return ids.every((id) => {
      const layer = findNodeById(scene, id);
      return layer ? canTransformLayer(layer) : false;
    });
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const scene = ctx.scene.getDocument();
    const page = ctx.scene.getActiveArtboard();
    const selected = ctx.selection.selectedNodeIds
      .map((id) => findNodeById(scene, id))
      .filter((layer): layer is DocumentNode => Boolean(layer));
    if (selected.length === 0) {
      return;
    }

    const group = createGroupFromLayers(
      `group-${crypto.randomUUID()}`,
      selected,
      page
    );
    const componentId = createComponentId();
    const component: DocumentComponent = {
      id: componentId,
      nodes: cloneNodeTree(getLayerChildren(group)),
      name: `Component ${Object.keys(scene.components ?? {}).length + 1}`,
    };
    const instanceId = createInstanceId();
    const instance: DocumentNode = applyNodeTransform(
      { id: instanceId, props: { componentId }, type: 'canvas.instance' },
      nodeTransform(group)
    );
    const selectedSet = new Set(ctx.selection.selectedNodeIds);
    const activeArtboardId = page.id;

    ctx.scene.apply({
      apply: (current) => ({
        ...current,
        components: {
          ...current.components,
          [componentId]: component,
        },
        artboards: current.artboards.map((entry) =>
          entry.id === activeArtboardId
            ? {
                ...entry,
                nodes: [
                  ...entry.nodes.filter((layer) => !selectedSet.has(layer.id)),
                  instance,
                ],
              }
            : entry
        ),
      }),
      label: localize(ctx.services, 'canvas.history.createComponent', {
        defaultValue: 'Create component',
      }),
    });
    ctx.scene.selectLayers([instance.id], instance.id);
  }
}

export class InsertComponentInstanceCommand extends Command {
  readonly id = 'canvas.insertInstance';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    if (!canInsertLayers(ctx.scene.getDocument())) {
      return false;
    }
    const componentId = (args as { componentId?: string } | undefined)
      ?.componentId;
    if (!componentId) {
      return false;
    }
    return Boolean(ctx.scene.getDocument().components?.[componentId]);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const componentId = (args as { componentId?: string } | undefined)
      ?.componentId;
    if (!componentId || !this.canExecute(ctx, args)) {
      return;
    }
    const page = ctx.scene.getActiveArtboard();
    const instance: DocumentNode = applyNodeTransform(
      {
        props: { componentId },
        id: createInstanceId(),
        type: 'canvas.instance',
      },
      {
        ...createDefaultTransform(),
        height: 120,
        width: 120,
        x: 40,
        y: 40,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
      }
    );
    const activeArtboardId = page.id;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((entry) =>
          entry.id === activeArtboardId
            ? { ...entry, nodes: [...entry.nodes, instance] }
            : entry
        ),
      }),
      label: localize(ctx.services, 'canvas.history.insertInstance', {
        defaultValue: 'Insert instance',
      }),
    });
    ctx.scene.selectLayers([instance.id], instance.id);
  }
}

/** Push the selected instance's definition layers from a provided layer tree. */
export class UpdateComponentDefinitionCommand extends Command {
  readonly id = 'canvas.updateComponent';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    const componentId = (args as { componentId?: string } | undefined)
      ?.componentId;
    const layers = (args as { layers?: DocumentNode[] } | undefined)?.layers;
    if (!(componentId && Array.isArray(layers))) {
      return false;
    }
    return Boolean(ctx.scene.getDocument().components?.[componentId]);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const input = args as
      | { componentId?: string; layers?: DocumentNode[]; name?: string }
      | undefined;
    if (!input?.componentId || !Array.isArray(input.layers)) {
      return;
    }
    if (!this.canExecute(ctx, args)) {
      return;
    }
    const componentId = input.componentId;
    ctx.scene.apply({
      apply: (scene) => {
        const existing = scene.components?.[componentId];
        if (!existing) {
          return scene;
        }
        return {
          ...scene,
          components: {
            ...scene.components,
            [componentId]: {
              ...existing,
              nodes: cloneNodeTree(input.layers as DocumentNode[]),
              ...(input.name !== undefined ? { name: input.name } : {}),
            },
          },
        };
      },
      label: localize(ctx.services, 'canvas.history.updateComponent', {
        defaultValue: 'Update component',
      }),
    });
  }
}
