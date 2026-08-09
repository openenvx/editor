import { SCHEMA_VERSION, type Scene } from '@openenvx/core/schema';

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
                  id: 'hero-1',
                  type: 'html.hero',
                  data: {
                    variant: 'centered',
                    backgroundImage: 'https://placehold.co/1200x600',
                    overlay: '#00000066',
                    minHeight: 360,
                    paddingY: 48,
                    align: 'center',
                    slots: {
                      headline: [
                        {
                          id: 'hero-1-headline',
                          type: 'html.heading',
                          data: {
                            html: 'Welcome',
                            level: '1',
                            color: '#ffffff',
                          },
                        },
                      ],
                      body: [
                        {
                          id: 'hero-1-body',
                          type: 'html.text',
                          visible: true,
                          data: {
                            html: 'Composite blocks keep one row in Layers while slot parts stay editable here and in the inspector.',
                            color: '#f3f4f6',
                          },
                        },
                      ],
                      actions: [
                        {
                          id: 'hero-1-cta',
                          type: 'html.button',
                          data: {
                            label: 'Get started',
                            href: '#',
                            color: '#ffffff',
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  id: 'heading-1',
                  type: 'html.heading',
                  data: {
                    html: 'Below the hero',
                    level: '2',
                    color: '#111827',
                  },
                },
                {
                  id: 'text-1',
                  type: 'html.text',
                  data: {
                    html: 'Drag blocks from the left palette into Flex or Grid. Click text to edit. Right-click for the context menu.',
                    color: '#374151',
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
                        data: {
                          html: 'Flex item',
                          level: '3',
                          color: '#111827',
                        },
                      },
                      {
                        id: 'text-2',
                        type: 'html.text',
                        data: { html: 'Another flex child', color: '#374151' },
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
                        data: {
                          html: 'Column A',
                          level: '3',
                          color: '#111827',
                        },
                      },
                      {
                        id: 'text-3',
                        type: 'html.text',
                        data: { html: 'Column B', color: '#374151' },
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
