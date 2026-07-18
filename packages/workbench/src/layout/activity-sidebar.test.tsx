import {
  MenuChoiceRegistryId,
  MenuChoiceRegistryImpl,
  MutableMenuChoiceProvider,
} from '@openenvx/core';
import type { ViewContainerDescriptor } from '@openenvx/headless';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
      id: 'workbench.layers',
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
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.pointerDown(document.body, { button: 0 });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes theme submenu when opening language', async () => {
    const user = userEvent.setup();
    renderActivitySidebar();

    await user.click(screen.getByRole('button', { name: 'File' }));
    await user.click(screen.getByRole('menuitem', { name: 'Theme' }));
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeTruthy();

    await user.click(screen.getByRole('menuitem', { name: 'Language' }));
    expect(screen.queryByRole('menuitemradio', { name: 'Light' })).toBeNull();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeTruthy();
  });

  it('closes the file menu when clicking another activity item', async () => {
    const user = userEvent.setup();
    renderActivitySidebar();

    const layersButton = screen.getByRole('button', { name: 'Layers' });
    await user.click(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.click(layersButton);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
