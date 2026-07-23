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
                  data: { text: 'Welcome', level: '1' },
                },
                {
                  id: 'text-1',
                  type: 'html.text',
                  data: {
                    text: 'Drag blocks from the left palette into containers. Select a block to edit its properties.',
                  },
                },
                {
                  id: 'container-1',
                  type: 'html.container',
                  data: {
                    padding: 16,
                    background: '#f8fafc',
                    children: [
                      {
                        id: 'heading-2',
                        type: 'html.heading',
                        data: { text: 'Nested section', level: '3' },
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
