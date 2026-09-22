import { getActiveArtboard, localize } from '@openenvx/studio/core';
import type { CommandContext, Document } from '@openenvx/studio/core';
import { artboardRulesLayout } from '@openenvx/studio/schema';

import { resolvePagePreset } from '../page-presets';
import { resizeAbsolutePage } from './scale-page-content';

export function resizeSceneToPagePreset(
  scene: Document,
  presetId: string
): Document | null {
  const preset = resolvePagePreset(presetId);
  if (!preset) {
    return null;
  }

  const page = getActiveArtboard(scene);
  if (artboardRulesLayout(page) !== 'absolute') {
    return null;
  }

  return {
    ...scene,
    artboards: scene.artboards.map((entry) =>
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
  const nextScene = resizeSceneToPagePreset(ctx.scene.getDocument(), presetId);
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
