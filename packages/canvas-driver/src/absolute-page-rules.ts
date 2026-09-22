import { PageRulesContribution } from '@openenvx/studio';
import type { Artboard, ValidationError } from '@openenvx/studio/schema';
import { artboardSpaceSize } from '@openenvx/studio/schema';

import {
  findPresetForArtboard,
  getDefaultPageDimensions,
} from './page-presets';

/** Absolute-layout page rules: default dims, preset inference, width/height required. */
export class AbsolutePageRules extends PageRulesContribution {
  readonly layout = 'absolute';

  normalizeArtboard(artboard: Artboard): Artboard {
    const defaults = getDefaultPageDimensions();
    let next: Artboard = {
      ...artboard,
      space: {
        ...artboard.space,
        height: artboard.space.height ?? defaults.height,
        width: artboard.space.width ?? defaults.width,
      },
    };
    if (!next.physical?.presetId) {
      const inferred = findPresetForArtboard(next);
      if (inferred) {
        next = {
          ...next,
          physical: { ...next.physical, presetId: inferred.id },
        };
      }
    }
    return next;
  }

  validateArtboard(artboard: Artboard): ValidationError[] {
    const { width, height } = artboardSpaceSize(artboard);
    if (typeof width !== 'number' || typeof height !== 'number') {
      return [
        {
          message: 'absolute layout requires width and height',
          path: `artboards.${artboard.id}.space`,
        },
      ];
    }
    return [];
  }
}
