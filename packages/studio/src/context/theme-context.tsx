import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { DEFAULT_THEME } from './theme-definitions';
import type { ThemeContextValue } from './theme-definitions';

export type { BuiltInTheme, ThemeContextValue } from './theme-definitions';
export {
  BUILT_IN_THEMES,
  DEFAULT_THEME,
  THEME_LABELS,
} from './theme-definitions';

const noop = () => {};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: noop,
});

export interface ThemeProviderProps {
  theme: string;
  onThemeChange?: (theme: string) => void;
  children: ReactNode;
}

export function ThemeProvider({
  theme,
  onThemeChange,
  children,
}: ThemeProviderProps) {
  const value = useMemo(
    (): ThemeContextValue => ({
      theme,
      setTheme: onThemeChange ?? noop,
    }),
    [onThemeChange, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): string {
  return useContext(ThemeContext).theme;
}

export function useSetTheme(): (theme: string) => void {
  return useContext(ThemeContext).setTheme;
}

export function useThemeScope(): { 'data-owb-theme': string } {
  return { 'data-owb-theme': useTheme() };
}

/** Marks studio workbench chrome for Synara preflight in `tokens.css`. */
export function useChromeScope(): { 'data-owb-chrome': '' } {
  return { 'data-owb-chrome': '' };
}

/** Theme + preflight scope for UI portaled outside the shell DOM tree. */
export function usePortalThemeScope(): {
  'data-owb-theme': string;
  'data-owb-chrome': '';
} {
  const theme = useTheme();
  return { 'data-owb-theme': theme, 'data-owb-chrome': '' };
}
