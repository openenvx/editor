import { Command } from '@openenvx/studio/core';
import type { ExtensionManifest } from '../protocol';
import {
  normalizeDocument,
  nodeTransform,
  type Document,
  type DocumentNode,
  type OpenEnvxWidgetProps,
  withArtboardRulesLayout,
} from '@openenvx/studio/schema';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { extensionBlockStore } from './panel-tree/extension-block-store';
import { registerWidgetInsertCommands } from './register-widget-insert-commands';
import type { SandboxHostSurface } from './sandbox-host-surface';

function createHost(document: Document): SandboxHostSurface & {
  commands: Map<string, Command>;
  applies: unknown[];
} {
  const commands = new Map<string, Command>();
  const applies: unknown[] = [];
  return {
    commands,
    applies,
    getSelection: () =>
      ({
        selectedNodeIds: [],
        primaryNodeId: null,
        activeArtboardId: document.artboards[0]?.id ?? null,
      }) as never,
    getScene: () => document as never,
    apply: (transaction) => {
      applies.push(transaction);
    },
    selectLayers: vi.fn(),
    onDidChangeScene: () => () => {},
    onDidChangeSelection: () => () => {},
    executeCommand: async () => ({ executed: true }),
    registerCommand: (command) => {
      commands.set(command.id, command);
      return {
        dispose: () => {
          commands.delete(command.id);
        },
      };
    },
    registerWorkbenchContributions: () => ({ dispose: vi.fn() }),
  };
}

afterEach(() => {
  extensionBlockStore.clear();
});

describe('registerWidgetInsertCommands', () => {
  it('registers widget insert command and drops a widget layer', () => {
    const document = normalizeDocument({
      artboards: [
        withArtboardRulesLayout(
          {
            id: 'p1',
            name: 'Page',
            space: { width: 800, height: 600 },
            nodes: [],
          },
          'absolute'
        ),
      ],
    });
    const host = createHost(document);
    const manifest: ExtensionManifest = {
      id: 'wm.seating',
      name: 'Seating',
      contributes: {
        widgets: [
          {
            id: 'wm.seating',
            label: 'Seating plan',
            kinds: ['canvas'],
            defaults: {
              width: 220,
              height: 180,
              tables: [{ id: 't1', label: '1', status: 'free' }],
            },
          },
        ],
        commands: [{ id: 'wm.seating.insert', title: 'Insert seating plan' }],
      },
    };

    registerWidgetInsertCommands(host, manifest, 'openenvx.widget');

    const command = host.commands.get('wm.seating.insert');
    expect(command?.title).toBe('Insert seating plan');
    command?.execute({} as never);

    expect(host.applies).toHaveLength(1);
    const tx = host.applies[0] as {
      apply: (scene: Document) => Document;
    };
    const next = tx.apply(document);
    const layer = next.artboards[0]?.nodes[0];
    const props = layer?.props as OpenEnvxWidgetProps | undefined;
    expect(layer?.type).toBe('openenvx.widget');
    expect(props?.extensionId).toBe('wm.seating');
    expect(props?.values).toEqual({
      tables: [{ id: 't1', label: '1', status: 'free' }],
    });
    expect(layer && nodeTransform(layer).opacity).toBe(1);
    expect(extensionBlockStore.getSnapshot()).toEqual([]);
  });

  it('nests HTML blocks under html.root and registers palette entries', () => {
    const document = normalizeDocument({
      artboards: [
        withArtboardRulesLayout(
          {
            id: 'p1',
            name: 'Page',
            space: { width: 800, height: 600 },
            nodes: [
              {
                id: 'root',
                type: 'html.root',
                props: {},
                children: [],
              },
            ],
          },
          'html'
        ),
      ],
    });
    const host = createHost(document);
    const manifest: ExtensionManifest = {
      id: 'wm.wedding',
      name: 'Wedding',
      contributes: {
        blocks: [
          {
            id: 'wm.countdown',
            label: 'Countdown',
            kinds: ['html'],
            defaults: { targetDate: '2026-09-12' },
          },
        ],
        commands: [{ id: 'wm.countdown.insert', title: 'Insert countdown' }],
      },
    };

    const disposables = registerWidgetInsertCommands(
      host,
      manifest,
      'openenvx.widget'
    );

    expect(extensionBlockStore.getSnapshot()).toEqual([
      {
        id: 'wm.countdown',
        label: 'Countdown',
        insertCommandId: 'wm.countdown.insert',
      },
    ]);

    host.commands.get('wm.countdown.insert')?.execute({} as never);
    const tx = host.applies[0] as {
      apply: (scene: Document) => Document;
    };
    const next = tx.apply(host.getScene() as never);
    const root = next.artboards[0]?.nodes[0];
    const widget = root?.children?.[0] as DocumentNode | undefined;
    const props = widget?.props as OpenEnvxWidgetProps | undefined;
    expect(widget?.type).toBe('openenvx.widget');
    expect(props?.extensionId).toBe('wm.countdown');

    for (const d of disposables) {
      d.dispose();
    }
    expect(extensionBlockStore.getSnapshot()).toEqual([]);
  });
});
