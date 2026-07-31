import { Command, Registry } from '@openenvx/core';
import { describe, expect, it, vi } from 'vitest';

import { ExternalHostMount } from './external-host-mount';

class TestCommand extends Command {
  readonly id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
  execute(): void {}
}

function createMount() {
  const commands = new Registry<string, Command>('overwrite');
  const viewPanelRegistry = new Registry<string, unknown>('overwrite');
  const icons = new Map<string, unknown>();
  const scene = {
    getSelection: () => ({ selectedLayerIds: [], primaryLayerId: null }),
    getScene: () => ({ id: 'scene', pages: [] }),
    apply: vi.fn(),
    onDidChangeScene: () => ({ dispose: () => {} }),
  };
  const mount = new ExternalHostMount({
    getSceneStore: () => scene as never,
    getEvents: () => ({
      onDidChangeSelection: () => ({ dispose: () => {} }),
    }),
    runCommand: async () => ({ executed: true }),
    registerCommand: (command) => {
      commands.register(command.id, command);
    },
    unregisterCommand: (commandId) => {
      commands.unregister(commandId);
    },
    onCommandsChanged: vi.fn(),
    registerWorkbenchContributions: () => ({ dispose: () => {} }),
    viewPanelRegistry,
    iconRegistry: {
      register: (id, glyph) => {
        icons.set(id, glyph);
      },
      unregister: (id) => icons.delete(id),
      registerDefaults: () => {},
      resolve: (id) => icons.get(id) ?? null,
    },
    onContributionsChanged: vi.fn(),
  });
  return { mount, commands, viewPanelRegistry, icons };
}

describe('ExternalHostMount', () => {
  it('unregisters surface registrations when the mount is disposed', () => {
    const { mount, commands, viewPanelRegistry, icons } = createMount();

    mount.mountSandbox((surface) => {
      surface.registerCommand(new TestCommand('sandbox.run.demo'));
    });
    mount.mountEmbedPanel((surface) => {
      surface.registerViewPanel('embed.panel.demo', { kind: 'panel' });
      surface.registerIcon('embed.icon.demo', { glyph: true });
    });

    expect(commands.has('sandbox.run.demo')).toBe(true);
    expect(viewPanelRegistry.has('embed.panel.demo')).toBe(true);
    expect(icons.has('embed.icon.demo')).toBe(true);

    mount.dispose();

    expect(commands.has('sandbox.run.demo')).toBe(false);
    expect(viewPanelRegistry.has('embed.panel.demo')).toBe(false);
    expect(icons.has('embed.icon.demo')).toBe(false);
  });

  it('allows remount after dispose without duplicating registrations', () => {
    const { mount, commands } = createMount();

    const disposeFirst = mount.mountSandbox((surface) => {
      surface.registerCommand(new TestCommand('sandbox.run.demo'));
    });
    disposeFirst();

    mount.mountSandbox((surface) => {
      surface.registerCommand(new TestCommand('sandbox.run.demo'));
    });

    expect(commands.has('sandbox.run.demo')).toBe(true);
    mount.dispose();
    expect(commands.has('sandbox.run.demo')).toBe(false);
  });
});
