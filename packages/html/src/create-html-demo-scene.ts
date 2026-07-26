import { SCHEMA_VERSION, type Scene } from '@openenvx/schema';

export function createHtmlDemoScene(): Scene {
  return {
    schemaVersion: SCHEMA_VERSION,
    pages: [
      {
        id: 'html-page',
        name: 'Home',
        layout: 'html',
        layers: [
          {
            id: 'root',
            type: 'html.root',
            data: {
              background: '#ffffff',
              children: [
                {
                  id: 'heading-1',
                  type: 'html.heading',
                  data: { html: 'Welcome', level: '1' },
                },
                {
                  id: 'text-1',
                  type: 'html.text',
                  data: {
                    html: 'Drag blocks from the left palette into Flex or Grid. Double-click text to edit. Right-click for the context menu.',
                  },
                },
                {
                  id: 'flex-1',
                  type: 'html.flex',
                  data: {
                    direction: 'row',
                    justify: 'flex-start',
                    gap: 24,
                    wrap: 'true',
                    paddingY: 0,
                    children: [
                      {
                        id: 'heading-2',
                        type: 'html.heading',
                        data: { html: 'Flex item', level: '3' },
                      },
                      {
                        id: 'text-2',
                        type: 'html.text',
                        data: { html: 'Another flex child' },
                      },
                    ],
                  },
                },
                {
                  id: 'grid-1',
                  type: 'html.grid',
                  data: {
                    columns: 2,
                    gap: 24,
                    paddingY: 0,
                    children: [
                      {
                        id: 'heading-3',
                        type: 'html.heading',
                        data: { html: 'Column A', level: '3' },
                      },
                      {
                        id: 'text-3',
                        type: 'html.text',
                        data: { html: 'Column B' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}
