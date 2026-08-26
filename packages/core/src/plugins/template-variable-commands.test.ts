import { normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import type { CommandContext } from '../runtime/types';
import { InstantiationService } from '../runtime/instantiation-service';
import {
  RichTextInsertServiceId,
  RichTextInsertServiceImpl,
} from '../services/rich-text-insert-service';
import {
  TextBlockInsertServiceId,
  type TextBlockInsertService,
} from '../services/text-block-insert-service';
import {
  AddVariableCommand,
  InsertVariableCommand,
} from './template-variable-commands';

function createCommandContext(scene: CommandContext['scene']): CommandContext {
  const services = new InstantiationService();
  services.registerInstance(RichTextInsertServiceId, new RichTextInsertServiceImpl());
  return {
    editor: {} as CommandContext['editor'],
    events: {} as CommandContext['events'],
    scene,
    selection: {
      activePageId: 'p1',
      primaryLayerId: null,
      selectedLayerIds: [],
    },
    services,
  };
}

describe('template-variable-commands', () => {
  it('rejects duplicate keys in addVariable canExecute', () => {
    const scene = normalizeScene({
      pages: [{ id: 'p1', layout: 'email', layers: [] }],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const ctx = createCommandContext({
      apply: () => {},
      canRedo: () => false,
      canUndo: () => false,
      getActivePage: () => scene.pages[0]!,
      getScene: () => scene,
      redo: () => {},
      selectLayers: () => {},
      undo: () => {},
    } as never);
    const command = new AddVariableCommand();
    expect(command.canExecute(ctx, { key: 'name' })).toBe(false);
    expect(command.canExecute(ctx, { key: 'other' })).toBe(true);
  });

  it('insertVariable requires an insert target', () => {
    const scene = normalizeScene({
      pages: [
        {
          id: 'p1',
          layout: 'email',
          layers: [
            {
              id: 'img1',
              type: 'email.image',
              data: { assetRef: 'a' },
            },
          ],
        },
      ],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const ctx = createCommandContext({
      apply: () => {},
      canRedo: () => false,
      canUndo: () => false,
      getActivePage: () => scene.pages[0]!,
      getScene: () => scene,
      redo: () => {},
      selectLayers: () => {},
      undo: () => {},
    } as never);
    ctx.selection = {
      activePageId: 'p1',
      primaryLayerId: 'img1',
      selectedLayerIds: ['img1'],
    };
    const command = new InsertVariableCommand();
    expect(command.canExecute(ctx, { key: 'name' })).toBe(false);

    const richText = ctx.services.get(RichTextInsertServiceId)!;
    richText.setHandler(() => {});
    expect(command.canExecute(ctx, { key: 'name' })).toBe(true);
    richText.setHandler(null);

    ctx.services.registerInstance(TextBlockInsertServiceId, {
      insert: () => true,
    } satisfies TextBlockInsertService);
    expect(command.canExecute(ctx, { key: 'name' })).toBe(true);
  });
});
