import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';

import { WorkbenchProvider } from './context/workbench-context';
import { ContextMenuRenderer } from './renderers/context-menu-renderer';
import { CommandPaletteRenderer } from './renderers/command-palette-renderer';
import { OverlayRenderer } from './renderers/overlay-renderer';
import { createMockWorkbenchApi } from './test/mock-workbench-context';

function renderWithWorkbench(
  ui: ReactNode,
  overrides: Parameters<typeof createMockWorkbenchApi>[0] = {}
) {
  const { api, executeCommand } = createMockWorkbenchApi(overrides);
  return {
    executeCommand,
    ...render(
      <WorkbenchProvider api={api}>
        <div data-owb-theme="dark">{ui}</div>
      </WorkbenchProvider>
    ),
  };
}

describe(ContextMenuRenderer, () => {
  it('opens menu on context menu event', async () => {
    const user = userEvent.setup();
    const menuItems = [{ commandId: 'scene.deleteLayer', label: 'Delete' }];
    renderWithWorkbench(
      <ContextMenuRenderer items={menuItems}>
        <span>Target</span>
      </ContextMenuRenderer>,
      {
        commandStates: { 'scene.deleteLayer': { canExecute: true } },
        contextMenu: menuItems,
      }
    );
    await user.pointer({
      keys: '[MouseRight>]',
      target: screen.getByText('Target'),
    });
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });
});

describe(OverlayRenderer, () => {
  it('renders visible overlay content', () => {
    renderWithWorkbench(
      <OverlayRenderer
        overlays={[
          {
            content: { kind: 'text', text: 'Welcome' },
            id: 'help',
            title: 'Help',
            visible: true,
          },
        ]}
      />
    );
    expect(screen.getByText('Help')).toBeTruthy();
    expect(screen.getByText('Welcome')).toBeTruthy();
  });

  it('runs commands from command-list overlay', async () => {
    const user = userEvent.setup();
    const { executeCommand } = renderWithWorkbench(
      <OverlayRenderer
        overlays={[
          {
            content: {
              commandIds: ['scene.undo'],
              kind: 'command-list',
            },
            id: 'actions',
            title: 'Actions',
            visible: true,
          },
        ]}
      />
    );
    await user.click(screen.getByRole('button', { name: 'scene.undo' }));
    expect(executeCommand).toHaveBeenCalledWith('scene.undo', undefined);
  });
});

describe(CommandPaletteRenderer, () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders grouped commands and executes selection', async () => {
    const user = userEvent.setup();
    const { executeCommand } = renderWithWorkbench(
      <CommandPaletteRenderer
        commandPalette={{
          categories: [{ id: 'scene', label: 'Scene' }],
          items: [
            {
              categoryId: 'scene',
              commandId: 'scene.undo',
              label: 'Undo',
              shortcut: 'Mod+Z',
            },
          ],
          tabs: [{ id: 'all', label: 'All' }],
        }}
        commandStates={{ 'scene.undo': { canExecute: true } }}
        executeCommand={async (commandId) => {
          await executeCommand(commandId);
          return true;
        }}
        onOpenChange={() => {}}
        open
      />
    );

    expect(screen.getByText('Scene')).toBeTruthy();
    expect(screen.getByText('Undo')).toBeTruthy();
    await user.click(screen.getByText('Undo'));
    expect(executeCommand).toHaveBeenCalledWith('scene.undo');
  });

  it('filters items by the active tab', async () => {
    const user = userEvent.setup();
    renderWithWorkbench(
      <CommandPaletteRenderer
        commandPalette={{
          categories: [
            { id: 'scene', label: 'Scene' },
            { id: 'assets', label: 'Assets' },
          ],
          items: [
            {
              categoryId: 'scene',
              commandId: 'scene.undo',
              label: 'Undo',
            },
            {
              categoryId: 'assets',
              commandId: 'canvas.insertImage',
              label: 'Image',
              tabId: 'assets',
            },
          ],
          tabs: [
            { id: 'all', label: 'All' },
            { id: 'assets', label: 'Assets' },
          ],
        }}
        commandStates={{}}
        executeCommand={async () => true}
        onOpenChange={() => {}}
        open
      />
    );

    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Assets' })).toBeTruthy();
    expect(screen.getByText('Undo')).toBeTruthy();
    expect(screen.getByText('Image')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Assets' }));
    expect(screen.queryByText('Undo')).toBeNull();
    expect(screen.getByText('Image')).toBeTruthy();
  });

  it('does not render when closed', () => {
    renderWithWorkbench(
      <CommandPaletteRenderer
        commandPalette={{
          categories: [],
          items: [{ commandId: 'scene.undo', label: 'Undo' }],
          tabs: [{ id: 'all', label: 'All' }],
        }}
        commandStates={{}}
        executeCommand={async () => true}
        onOpenChange={() => {}}
        open={false}
      />
    );
    expect(screen.queryByPlaceholderText('Search')).toBeNull();
  });
});
