import {
  Command,
  canInsertLayers,
  canTransformLayer,
  cloneLayerTree,
  findLayerById,
  localize,
} from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import type { SceneComponent } from '@xmazu/openenvxee-schema';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';

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
    if (!canInsertLayers(ctx.scene.getScene())) {
      return false;
    }
    const ids = ctx.selection.selectedLayerIds;
    if (ids.length === 0) {
      return false;
    }
    const scene = ctx.scene.getScene();
    return ids.every((id) => {
      const layer = findLayerById(scene, id);
      return layer ? canTransformLayer(layer) : false;
    });
  }

  execute(ctx: CommandContext): void {
    if (!this.canExecute(ctx)) {
      return;
    }
    const scene = ctx.scene.getScene();
    const page = ctx.scene.getActivePage();
    const selected = ctx.selection.selectedLayerIds
      .map((id) => findLayerById(scene, id))
      .filter((layer): layer is Layer => Boolean(layer));
    if (selected.length === 0) {
      return;
    }

    const group = createGroupFromLayers(
      `group-${crypto.randomUUID()}`,
      selected,
      page
    );
    const componentId = createComponentId();
    const component: SceneComponent = {
      id: componentId,
      layers: cloneLayerTree((group.data as { children: Layer[] }).children),
      name: `Component ${Object.keys(scene.components ?? {}).length + 1}`,
    };
    const instance: Layer = {
      data: { componentId },
      id: createInstanceId(),
      transform: group.transform ?? createDefaultTransform(),
      type: 'canvas.instance',
    };
    const selectedSet = new Set(ctx.selection.selectedLayerIds);
    const activePageId = page.id;

    ctx.scene.apply({
      apply: (current) => ({
        ...current,
        components: {
          ...current.components,
          [componentId]: component,
        },
        pages: current.pages.map((entry) =>
          entry.id === activePageId
            ? {
                ...entry,
                layers: [
                  ...entry.layers.filter((layer) => !selectedSet.has(layer.id)),
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
    if (!canInsertLayers(ctx.scene.getScene())) {
      return false;
    }
    const componentId = (args as { componentId?: string } | undefined)
      ?.componentId;
    if (!componentId) {
      return false;
    }
    return Boolean(ctx.scene.getScene().components?.[componentId]);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const componentId = (args as { componentId?: string } | undefined)
      ?.componentId;
    if (!componentId || !this.canExecute(ctx, args)) {
      return;
    }
    const page = ctx.scene.getActivePage();
    const instance: Layer = {
      data: { componentId },
      id: createInstanceId(),
      transform: {
        ...createDefaultTransform(),
        height: 120,
        width: 120,
        x: 40,
        y: 40,
      },
      type: 'canvas.instance',
    };
    const activePageId = page.id;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((entry) =>
          entry.id === activePageId
            ? { ...entry, layers: [...entry.layers, instance] }
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
    const layers = (args as { layers?: Layer[] } | undefined)?.layers;
    if (!(componentId && Array.isArray(layers))) {
      return false;
    }
    return Boolean(ctx.scene.getScene().components?.[componentId]);
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const input = args as
      | { componentId?: string; layers?: Layer[]; name?: string }
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
              layers: cloneLayerTree(input.layers as Layer[]),
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
