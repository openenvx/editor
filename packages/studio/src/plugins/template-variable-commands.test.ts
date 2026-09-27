import { describe, expect, it, vi } from 'vitest';

import { normalizeDocumentForTest } from '../test/document-fixtures';

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
import { WorkbenchEvents } from '../runtime/workbench-events';
import { formatVariableToken } from '../schema/template-variables';
import {
  AddVariableCommand,
  executeSceneVariableCommand,
  InsertVariableCommand,
} from './template-variable-commands';

function createCommandContext(scene: CommandContext['scene']): CommandContext {
  const services = new InstantiationService();
  services.registerInstance(RichTextInsertServiceId, new RichTextInsertServiceImpl());
  const emitted: { commandId: string }[] = [];
  return {
    editor: {} as CommandContext['editor'],
    events: {
      emit: (event, payload) => {
        if (event === WorkbenchEvents.DidExecuteCommand) {
          emitted.push(payload as { commandId: string });
        }
      },
    } as CommandContext['events'],
    scene,
    selection: {
      activeArtboardId: 'p1',
      primaryNodeId: null,
      selectedNodeIds: [],
    },
    services,
  };
}

describe('template-variable-commands', () => {
  it('executeSceneVariableCommand emits DidExecuteCommand', async () => {
    const scene = normalizeDocumentForTest({
      pages: [{ id: 'p1', layout: 'email', layers: [] }],
      variables: [],
    });
    const emit = vi.fn();
    const ctx = createCommandContext({
      apply: (op: { apply: (scene: typeof scene) => typeof scene }) => {
        const next = op.apply(scene);
        scene.variables = next.variables;
      },
      canRedo: () => false,
      canUndo: () => false,
      getActiveArtboard: () => scene.artboards[0]!,
      getDocument: () => scene,
      redo: () => {},
      selectNodes: () => {},
      undo: () => {},
    } as never);
    ctx.events = { emit } as CommandContext['events'];

    await executeSceneVariableCommand(ctx, 'scene.addVariable', {
      key: 'email',
      sample: 'x',
    });

    expect(emit).toHaveBeenCalledWith(WorkbenchEvents.DidExecuteCommand, {
      commandId: 'scene.addVariable',
      result: undefined,
    });
    expect(scene.variables).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'email' })])
    );
  });

  it('rejects duplicate keys in addVariable canExecute', () => {
    const scene = normalizeDocumentForTest({
      pages: [{ id: 'p1', layout: 'email', layers: [] }],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const ctx = createCommandContext({
      apply: () => {},
      canRedo: () => false,
      canUndo: () => false,
      getActiveArtboard: () => scene.artboards[0]!,
      getDocument: () => scene,
      redo: () => {},
      selectNodes: () => {},
      undo: () => {},
    } as never);
    const command = new AddVariableCommand();
    expect(command.canExecute(ctx, { key: 'name' })).toBe(false);
    expect(command.canExecute(ctx, { key: 'other' })).toBe(true);
  });

  it('insertVariable requires an insert target', () => {
    const scene = normalizeDocumentForTest({
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
      getActiveArtboard: () => scene.artboards[0]!,
      getDocument: () => scene,
      redo: () => {},
      selectNodes: () => {},
      undo: () => {},
    } as never);
    ctx.selection = {
      activeArtboardId: 'p1',
      primaryNodeId: 'img1',
      selectedNodeIds: ['img1'],
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

  it('insertVariable appends token to selected canvas.qr url', () => {
    const scene = normalizeDocumentForTest({
      pages: [
        {
          id: 'p1',
          layout: 'absolute',
          layers: [
            {
              id: 'qr1',
              type: 'canvas.qr',
              data: { url: 'https://example.com/' },
            },
          ],
        },
      ],
      variables: [{ id: 'v1', key: 'eventId' }],
    });
    const apply = vi.fn((op: { apply: (s: typeof scene) => typeof scene }) => {
      const next = op.apply(scene);
      scene.artboards = next.artboards;
    });
    const ctx = createCommandContext({
      apply,
      canRedo: () => false,
      canUndo: () => false,
      getActiveArtboard: () => scene.artboards[0]!,
      getDocument: () => scene,
      redo: () => {},
      selectNodes: () => {},
      undo: () => {},
    } as never);
    ctx.selection = {
      activeArtboardId: 'p1',
      primaryNodeId: 'qr1',
      selectedNodeIds: ['qr1'],
    };
    const command = new InsertVariableCommand();
    expect(command.canExecute(ctx, { key: 'eventId' })).toBe(true);
    command.execute(ctx, { key: 'eventId' });
    expect(apply).toHaveBeenCalled();
    const qr = scene.artboards[0]!.nodes[0]!;
    const url = (qr.props as { url: string }).url;
    expect(url).toBe(
      `https://example.com/${formatVariableToken('eventId')}`
    );
  });
});
