import type { SidebarHeaderDescriptor } from '@openenvx/headless';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider } from '../context/theme-context';
import { WorkbenchProvider } from '../context/workbench-context';
import { ViewContainerHeader } from './view-container-header';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';

afterEach(cleanup);

function renderHeader(header?: SidebarHeaderDescriptor) {
  const { api, executeCommand } = createMockWorkbenchApi({
    editor: {
      isDirty: false,
      scene: {
        pages: [{ id: 'p1', layout: 'absolute', layers: [], name: 'Page' }],
      },
      title: 'Gilded Hour Pass',
      uri: 'doc://gilded',
    },
  });

  render(
    <ThemeProvider theme="light">
      <WorkbenchProvider api={api}>
        <ViewContainerHeader
          containerId="workbench.sidebar"
          header={header}
          location="primary"
          title="Layers"
        />
      </WorkbenchProvider>
    </ThemeProvider>
  );

  return { executeCommand };
}

describe('ViewContainerHeader', () => {
  it('renders default title when no header contribution', () => {
    renderHeader();
    expect(screen.getByText('Layers')).toBeTruthy();
  });

  it('renders bound editor title, menu, and action commands', async () => {
    const user = userEvent.setup();
    const { executeCommand } = renderHeader({
      actions: [
        {
          commandId: 'workbench.save',
          icon: 'cloudCheck',
          id: 'save',
          label: 'Save',
        },
      ],
      containerId: 'workbench.sidebar',
      menuItems: [
        {
          commandId: 'workbench.save',
          id: 'workbench.save',
          kind: 'command',
          label: 'Save document',
        },
      ],
      priority: 0,
      showMoveMenu: false,
      titleBinding: 'editorTitle',
    });

    expect(screen.getByText('Gilded Hour Pass')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(executeCommand).toHaveBeenCalledWith('workbench.save');

    await user.click(
      screen.getByRole('button', { name: 'Gilded Hour Pass' })
    );
    expect(
      screen.getByRole('menuitem', { name: 'Save document' })
    ).toBeTruthy();
  });
});
