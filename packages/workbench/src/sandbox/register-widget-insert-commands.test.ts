import { Command } from '@openenvx/core';
import {
  extensionBlockStore,
  type SandboxHostSurface,
} from '@openenvx/headless';
import type { ExtensionManifest } from '@xmazu/openenvxee-extensions/protocol';
import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerWidgetInsertCommands } from './register-widget-insert-commands';

function createHost(scene: {
  version: number;
  pages: {
    id: string;
    name: string;
    width: number;
    height: number;
    layers: unknown[];
    layout?: string;
  }[];
}): SandboxHostSurface & {
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
        selectedLayerIds: [],
        primaryLayerId: null,
        activePageId: scene.pages[0]?.id ?? null,
      }) as never,
    getScene: () => scene as never,
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
    const host = createHost({
      version: 1,
      pages: [{ id: 'p1', name: 'Page', width: 800, height: 600, layers: [] }],
    });
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
      apply: (scene: {
        pages: { id: string; layers: unknown[] }[];
      }) => {
        pages: { layers: { type: string; data: Record<string, unknown> }[] }[];
      };
    };
    const next = tx.apply({
      pages: [{ id: 'p1', layers: [] }],
    });
    const layer = next.pages[0]?.layers[0];
    expect(layer?.type).toBe('openenvx.widget');
    expect(layer?.data.extensionId).toBe('wm.seating');
    expect(layer?.data.values).toEqual({
      tables: [{ id: 't1', label: '1', status: 'free' }],
    });
    expect(createDefaultTransform().opacity).toBe(1);
    expect(extensionBlockStore.getSnapshot()).toEqual([]);
  });

  it('nests HTML blocks under html.root and registers palette entries', () => {
    const host = createHost({
      version: 1,
      pages: [
        {
          id: 'p1',
          name: 'Page',
          width: 800,
          height: 600,
          layout: 'html',
          layers: [
            {
              id: 'root',
              type: 'html.root',
              data: { children: [] },
            },
          ],
        },
      ],
    });
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
      apply: (scene: {
        pages: {
          id: string;
          layers: {
            id: string;
            type: string;
            data: { children: { type: string; data: Record<string, unknown> }[] };
          }[];
        }[];
      }) => {
        pages: {
          layers: {
            data: { children: { type: string; data: Record<string, unknown> }[] };
          }[];
        }[];
      };
    };
    const next = tx.apply(host.getScene() as never);
    const root = next.pages[0]?.layers[0];
    const widget = root?.data.children[0];
    expect(widget?.type).toBe('openenvx.widget');
    expect(widget?.data.extensionId).toBe('wm.countdown');

    for (const d of disposables) {
      d.dispose();
    }
    expect(extensionBlockStore.getSnapshot()).toEqual([]);
  });
});
