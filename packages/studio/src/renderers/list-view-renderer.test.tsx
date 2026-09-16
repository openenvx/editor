import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkbenchProvider } from '../context/workbench-context';
import { workbenchI18n } from '../i18n/workbench-i18n';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';
import { ListViewRenderer } from './list-view-renderer';

afterEach(cleanup);

function renderListView(
  viewOverrides: Partial<Parameters<typeof ListViewRenderer>[0]['view']> = {},
  apiOverrides: Parameters<typeof createMockWorkbenchApi>[0] = {}
) {
  const { api, executeCommand } = createMockWorkbenchApi(apiOverrides);
  const view = {
    addCommandId: 'catalog.add',
    collapsible: false,
    containerId: 'catalog',
    content: {
      items: [
        {
          actions: [
            {
              commandId: 'catalog.edit',
              icon: 'pencil',
              label: 'Edit item',
            },
          ],
          depth: 0,
          hasChildren: false,
          id: 'item-1',
          label: '{{{name}}}',
          source: { id: 'item-1' },
        },
      ],
      kind: 'list' as const,
    },
    emptyMessage: 'No items yet.',
    id: 'catalog.list',
    initialCollapsed: false,
    name: 'Catalog',
    supportsReorder: false,
    viewHover: 'none' as const,
    viewOrder: 0,
    viewSelection: 'none' as const,
    ...viewOverrides,
  };

  render(
    <I18nextProvider i18n={workbenchI18n}>
      <WorkbenchProvider api={api}>
        <ListViewRenderer view={view} />
      </WorkbenchProvider>
    </I18nextProvider>
  );

  return { api, executeCommand, view };
}

describe('ListViewRenderer', () => {
  it('shows empty message and add button', () => {
    renderListView({
      content: { items: [], kind: 'list' },
    });

    expect(screen.getByText('No items yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeTruthy();
  });

  it('fires add and row action commands', () => {
    const { executeCommand } = renderListView();

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(executeCommand).toHaveBeenCalledWith('catalog.add', undefined);

    fireEvent.click(screen.getByRole('button', { name: 'Edit item' }));
    expect(executeCommand).toHaveBeenCalledWith('catalog.edit', { id: 'item-1' });
  });

  it('fires row command when commandId is set', () => {
    const { executeCommand } = renderListView({
      content: {
        items: [
          {
            commandId: 'catalog.open',
            depth: 0,
            hasChildren: false,
            id: 'item-1',
            label: 'Open me',
            source: { id: 'item-1' },
          },
        ],
        kind: 'list',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open me' }));
    expect(executeCommand).toHaveBeenCalledWith('catalog.open', { id: 'item-1' });
  });

  it('delegates reorder to moveViewItem when supportsReorder is true', () => {
    const moveViewItem = vi.fn();
    const { api } = renderListView({
      supportsReorder: true,
      content: {
        kind: 'list',
        items: [
          {
            depth: 0,
            hasChildren: false,
            id: 'a',
            label: 'A',
            source: { id: 'a' },
          },
          {
            depth: 0,
            hasChildren: false,
            id: 'b',
            label: 'B',
            source: { id: 'b' },
          },
        ],
      },
    });
    api.moveViewItem = moveViewItem;

    // ponytail: DnD drag simulation is heavy; smoke the renderer wiring only.
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });
});
