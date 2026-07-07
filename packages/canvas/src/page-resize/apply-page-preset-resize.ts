import { getActivePage, localize } from '@openenvx/core';
import type { CommandContext, Scene } from '@openenvx/core';
import { resolvePagePreset } from '@openenvx/schema';

import { resizeAbsolutePage } from './scale-page-content';

export function resizeSceneToPagePreset(
  scene: Scene,
  presetId: string
): Scene | null {
  const preset = resolvePagePreset(presetId);
  if (!preset) {
    return null;
  }

  const page = getActivePage(scene);
  if (page.layout !== 'absolute') {
    return null;
  }

  return {
    ...scene,
    pages: scene.pages.map((entry) =>
      entry.id === page.id
        ? resizeAbsolutePage(entry, preset.width, preset.height, preset.id)
        : entry
    ),
  };
}

export function applyPagePresetResize(
  ctx: CommandContext,
  presetId: string
): boolean {
  const nextScene = resizeSceneToPagePreset(ctx.scene.getScene(), presetId);
  if (!nextScene) {
    return false;
  }

  ctx.scene.apply({
    apply: () => nextScene,
    label: localize(ctx.services, 'canvas.history.resizePage', {
      defaultValue: 'Resize page',
    }),
  });
  return true;
}
