import {
  MenuChoiceRegistryId,
  MenuChoiceRegistryImpl,
  MutableMenuChoiceProvider,
} from '@openenvx/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ThemeProvider,
  useSetTheme,
  useTheme,
  useThemeScope,
} from './context/theme-context';
import { WorkbenchProvider } from './context/workbench-context';
import { Button } from './primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './primitives/dropdown-menu';
import { DropdownMenuRenderer } from './renderers/dropdown-menu-renderer';
import { WorkbenchShell } from './shell/workbench-shell';
import { createMockWorkbenchApi } from './test/mock-workbench-context';

const WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID = 'workbench.theme';
const WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID = 'workbench.locale';

afterEach(cleanup);

function ThemeReader() {
  const theme = useTheme();
  return <span data-testid="theme">{theme}</span>;
}

function ThemeScopeReader() {
  const scope = useThemeScope();
  return <span data-testid="scope">{JSON.stringify(scope)}</span>;
}

describe('theme context', () => {
  it('defaults to light when used outside a provider', () => {
    render(<ThemeReader />);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('provides the active theme from ThemeProvider', () => {
    render(
      <ThemeProvider theme="dark">
        <ThemeReader />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('useThemeScope returns the data-owb-theme attribute', () => {
    render(
      <ThemeProvider theme="brand">
        <ThemeScopeReader />
      </ThemeProvider>
    );
    expect(screen.getByTestId('scope').textContent).toBe(
      JSON.stringify({ 'data-owb-theme': 'brand' })
    );
  });

  it('calls onThemeChange from useSetTheme', () => {
    const onThemeChange = vi.fn();
    function ThemeSwitcher() {
      const setTheme = useSetTheme();
      return (
        <button onClick={() => setTheme('dark')} type="button">
          Switch
        </button>
      );
    }
    render(
      <ThemeProvider onThemeChange={onThemeChange} theme="light">
        <ThemeSwitcher />
      </ThemeProvider>
    );
    screen.getByRole('button', { name: 'Switch' }).click();
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });
});

describe('portal theme propagation', () => {
  it('applies the active theme to a dropdown menu portal', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme="dark">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Item</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const menu = screen.getByRole('menu');
    expect(menu.dataset.owbTheme).toBe('dark');
  });
});

describe('WorkbenchShell theme', () => {
  it('defaults to light theme on the loading state', () => {
    render(<WorkbenchShell plugins={[]} />);
    expect(screen.getByText('Loading…').dataset.owbTheme).toBe('light');
  });

  it('uses the provided theme on the loading state', () => {
    render(<WorkbenchShell plugins={[]} theme="dark" />);
    expect(screen.getByText('Loading…').dataset.owbTheme).toBe('dark');
  });

  it('accepts a custom theme name on the loading state', () => {
    render(<WorkbenchShell plugins={[]} theme="brand" />);
    expect(screen.getByText('Loading…').dataset.owbTheme).toBe('brand');
  });
});

describe('DropdownMenu dismiss', () => {
  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme="light">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button>Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div>Item</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.pointerDown(document.body, { button: 0 });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('DropdownMenu submenus', () => {
  it('closes a sibling submenu when opening another', async () => {
    const user = userEvent.setup();
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
    const { api: baseApi } = createMockWorkbenchApi();
    const api = {
      ...baseApi,
      getService: (id: unknown) =>
        id === MenuChoiceRegistryId ? registry : undefined,
    };

    render(
      <ThemeProvider theme="light">
        <WorkbenchProvider api={api}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <Button>Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRenderer
                items={[
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
                ]}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </WorkbenchProvider>
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Theme' }));
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeTruthy();

    await user.click(screen.getByRole('menuitem', { name: 'Language' }));
    expect(screen.queryByRole('menuitemradio', { name: 'Light' })).toBeNull();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeTruthy();
  });
});

describe('DropdownMenuRenderer theme menu', () => {
  it('renders light and dark options in the theme submenu', async () => {
    const user = userEvent.setup();
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
    const { api: baseApi } = createMockWorkbenchApi();
    const api = {
      ...baseApi,
      getService: (id: unknown) =>
        id === MenuChoiceRegistryId ? registry : undefined,
    };

    render(
      <ThemeProvider onThemeChange={vi.fn()} theme="light">
        <WorkbenchProvider api={api}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <Button>Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRenderer
                items={[
                  {
                    id: 'theme',
                    kind: 'radioGroup',
                    label: 'Theme',
                    providerId: WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID,
                  },
                ]}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </WorkbenchProvider>
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Theme' }));
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeTruthy();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeTruthy();
  });
});
