import { describe, expect, it, vi } from 'vitest';

import { normalizeDocumentForTest } from '../test/document-fixtures';
import { createMockCommandContext } from '../test/mock-command-context';

import {
  type TextBlockInsertService,
  TextBlockInsertServiceId,
  WorkbenchEvents,
  InstantiationService,
} from '@openenvx/studio';
import {
  RichTextInsertServiceId,
  RichTextInsertServiceImpl,
} from '../services/rich-text-insert-service';
import { formatVariableToken } from '../schema/template-variables';
import {
  AddVariableCommand,
  executeSceneVariableCommand,
  InsertVariableCommand,
} from './template-variable-commands';

function createCommandContextForDocument(
  document: ReturnType<typeof normalizeDocumentForTest>,
  selectedIds: string[] = [],
  primaryId: string | null = null
) {
  const services = new InstantiationService();
  services.registerInstance(
    RichTextInsertServiceId,
    new RichTextInsertServiceImpl()
  );
  const { ctx: baseCtx, store } = createMockCommandContext(document, {
    selectedIds,
    primaryId,
  });
  const merged = baseCtx.services as InstantiationService;
  merged.registerInstance(
    RichTextInsertServiceId,
    services.get(RichTextInsertServiceId)!
  );
  return { ctx: baseCtx, store };
}

describe('template-variable-commands', () => {
  it('executeSceneVariableCommand emits DidExecuteCommand', async () => {
    const document = normalizeDocumentForTest({
      pages: [{ id: 'p1', layout: 'email', layers: [] }],
      variables: [],
    });
    const emit = vi.fn();
    const { ctx, store } = createCommandContextForDocument(document);
    ctx.events = { emit, on: () => () => {} };

    await executeSceneVariableCommand(ctx, 'scene.addVariable', {
      key: 'email',
      sample: 'x',
    });

    expect(emit).toHaveBeenCalledWith(WorkbenchEvents.DidExecuteCommand, {
      commandId: 'scene.addVariable',
      result: undefined,
    });
    expect(store.getDocument().variables).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'email' })])
    );
  });

  it('rejects duplicate keys in addVariable canExecute', () => {
    const document = normalizeDocumentForTest({
      pages: [{ id: 'p1', layout: 'email', layers: [] }],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const { ctx } = createCommandContextForDocument(document);
    const command = new AddVariableCommand();
    expect(command.canExecute(ctx, { key: 'name' })).toBe(false);
    expect(command.canExecute(ctx, { key: 'other' })).toBe(true);
  });

  it('insertVariable requires an insert target', () => {
    const document = normalizeDocumentForTest({
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
    const { ctx } = createCommandContextForDocument(
      document,
      ['img1'],
      'img1'
    );
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
    const document = normalizeDocumentForTest({
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
    const { ctx, store } = createCommandContextForDocument(
      document,
      ['qr1'],
      'qr1'
    );
    const command = new InsertVariableCommand();
    expect(command.canExecute(ctx, { key: 'eventId' })).toBe(true);
    command.execute(ctx, { key: 'eventId' });
    const qr = store.getDocument().artboards[0]!.nodes[0]!;
    const url = (qr.props as { url: string }).url;
    expect(url).toBe(
      `https://example.com/${formatVariableToken('eventId')}`
    );
  });
});