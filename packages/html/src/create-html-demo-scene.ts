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
                    html: 'Drag blocks from the left palette into containers. Double-click text to edit. Right-click for the context menu.',
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
                        data: { html: 'Nested section', level: '3' },
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
