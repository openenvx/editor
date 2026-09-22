import type { Artboard, DocumentNode } from '@openenvx/studio/schema';
import {
  artboardRulesLayout,
  legacyTestLayer,
  withArtboardRulesLayout,
} from '@openenvx/studio/schema';

export function testEmailArtboard(
  partial: Partial<Artboard> &
    Pick<Artboard, 'id'> & { nodes?: DocumentNode[] },
  layout = 'email'
): Artboard {
  const { nodes = [], ...rest } = partial;
  return withArtboardRulesLayout(
    {
      name: 'Page',
      space: { width: 600, height: 800 },
      nodes,
      ...rest,
    },
    layout
  );
}

export { artboardRulesLayout, legacyTestLayer };
