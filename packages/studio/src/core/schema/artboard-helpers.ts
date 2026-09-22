import type { Artboard } from './types';

export const DEFAULT_ARTBOARD_RULES_LAYOUT_KEY = 'layout';

export function artboardRulesLayout(artboard: Artboard): string {
  const layout = artboard.extensions?.[DEFAULT_ARTBOARD_RULES_LAYOUT_KEY];
  return typeof layout === 'string' ? layout : 'flow';
}

export function withArtboardRulesLayout(
  artboard: Artboard,
  layout: string
): Artboard {
  return {
    ...artboard,
    extensions: {
      ...artboard.extensions,
      [DEFAULT_ARTBOARD_RULES_LAYOUT_KEY]: layout,
    },
  };
}

const DEFAULT_ARTBOARD_WIDTH = 800;
const DEFAULT_ARTBOARD_HEIGHT = 600;

export function artboardSpaceSize(artboard: Artboard): {
  width: number;
  height: number;
} {
  return {
    width: artboard.space.width ?? DEFAULT_ARTBOARD_WIDTH,
    height: artboard.space.height ?? DEFAULT_ARTBOARD_HEIGHT,
  };
}
