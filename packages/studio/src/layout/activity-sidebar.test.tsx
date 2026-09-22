import {
  MenuChoiceRegistryId,
  MenuChoiceRegistryImpl,
  MutableMenuChoiceProvider,
} from '@openenvx/studio/core';
import type { ViewContainerDescriptor } from '@openenvx/studio/core';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../context/theme-context';
import { WorkbenchProvider } from '../context/workbench-context';
import { ActivitySidebar } from '../layout/activity-sidebar';
import { createMockWorkbenchApi } from '../test/mock-workbench-context';

const WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID = 'workbench.theme';
const WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID = 'workbench.locale';

afterEach(cleanup);

function createFileMenuContainers(): ViewContainerDescriptor[] {
  return [
    {
      icon: 'file',
      id: 'workbench.file',
      location: 'primary',
      menuItems: [
        {
          id: 'theme',
          kind: 'radioGroup',
          label: 'Theme',
          providerId: WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID,
        },
        {
          id: 'language',
          kind: 'radioGroup',
          label: 'Language',
          providerId: WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID,
        },
      ],
      sidebarBehavior: 'dropdown',
      sidebarGroup: 0,
      sidebarOrder: 0,
      title: 'File',
      views: [],
    },
    {
      icon: 'layers',
      id: 'workbench.nodes',
      location: 'primary',
      sidebarBehavior: 'panel',
      sidebarGroup: 0,
      sidebarOrder: 1,
      title: 'Layers',
      views: [],
    },
  ];
}

function renderActivitySidebar() {
  const registry = new MenuChoiceRegistryImpl();
  registry.register(
    new MutableMenuChoiceProvider(WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID, {
      getValue: () => 'light',
      setValue: vi.fn(),
      getChoices: () => [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
    })
  );
  registry.register(
    new MutableMenuChoiceProvider(WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID, {
      getValue: () => 'en',
      setValue: vi.fn(),
      getChoices: () => [
        { value: 'en', label: 'English' },
        { value: 'pl', label: 'Polish' },
      ],
    })
  );

  const { api: baseApi } = createMockWorkbenchApi({
    commandStates: {},
    viewContainers: createFileMenuContainers(),
  });
  const api = {
    ...baseApi,
    getService: (id: unknown) =>
      id === MenuChoiceRegistryId ? registry : undefined,
  };

  return render(
    <>
      <ThemeProvider theme="light">
        <WorkbenchProvider api={api}>
          <ActivitySidebar viewContainers={createFileMenuContainers()} />
        </WorkbenchProvider>
      </ThemeProvider>
      <button type="button">Outside workbench</button>
    </>
  );
}

describe('ActivitySidebar dropdown', () => {
  it('closes the file menu on outside pointer down', async () => {
    const user = userEvent.setup();
    renderActivitySidebar();

    await user.click(screen.getByRole('button', { name: 'File' }));
    await screen.findByRole('menu');

    fireEvent.pointerDown(document.body, { button: 0 });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes theme submenu when opening language', async () => {
    const user = userEvent.setup();
    renderActivitySidebar();

    await user.click(screen.getByRole('button', { name: 'File' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Theme' }));
    await screen.findByRole('menuitemradio', { name: 'Light' });

    await user.click(screen.getByRole('menuitem', { name: 'Language' }));
    await waitFor(() => {
      expect(screen.queryByRole('menuitemradio', { name: 'Light' })).toBeNull();
    });
    await screen.findByRole('menuitemradio', { name: 'English' });
  });

  it('closes the file menu when clicking another activity item', async () => {
    const user = userEvent.setup();
    renderActivitySidebar();

    const layersButton = screen.getByRole('button', { name: 'Layers' });
    await user.click(screen.getByRole('button', { name: 'File' }));
    await screen.findByRole('menu');

    fireEvent.click(layersButton);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
