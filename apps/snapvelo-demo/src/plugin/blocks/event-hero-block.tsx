import type { BlockConfig } from '@openenvx/html-studio';
import type { ReactElement } from 'react';

export const EVENT_HERO_TYPE = 'snapvelo.eventHero';
export const EVENT_HERO_LAYER_ID = 'event-hero';

export const eventHeroBlock: BlockConfig = {
  type: EVENT_HERO_TYPE,
  label: 'Event hero',
  treeIcon: 'image',
  palette: false,
  acceptsChildren: true,
  // Placement + structure are CSS-fixed — keep bubble menu to marks only.
  childRichTextToolbar: {
    blockType: false,
    link: false,
    code: false,
    align: false,
  },
  fields: {},
  defaultData: {
    children: [],
  },
  render: ({ children }): ReactElement => (
    <div className="snapvelo-hero">{children}</div>
  ),
};
