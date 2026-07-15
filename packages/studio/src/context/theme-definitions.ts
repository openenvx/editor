export const DEFAULT_THEME = 'light' as const;

export const BUILT_IN_THEMES = ['light', 'dark'] as const;

export type BuiltInTheme = (typeof BUILT_IN_THEMES)[number];

export const THEME_LABELS: Record<BuiltInTheme, string> = {
  light: 'Light',
  dark: 'Dark',
};

export interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
}
