import { normalizeDocument, type Document } from '@openenvx/studio/schema';

/** Demo HTML document for package demos (normalized Document shape). */
export function createHtmlDemoScene(): Document {
  return normalizeDocument({
    artboards: [
      {
        id: 'html-page',
        name: 'Home',
        extensions: { layout: 'html' },
        nodes: [
          {
            id: 'root',
            type: 'html.root',
            props: { background: '#ffffff' },
            children: [
              {
                id: 'hero-1',
                type: 'html.hero',
                props: {
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
                        props: {
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
                        props: {
                          html: 'Composite blocks keep one row in Layers while slot parts stay editable here and in the inspector.',
                          color: '#f3f4f6',
                        },
                      },
                    ],
                    actions: [
                      {
                        id: 'hero-1-cta',
                        type: 'html.button',
                        props: {
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
                props: {
                  html: 'Below the hero',
                  level: '2',
                  color: '#111827',
                },
              },
              {
                id: 'text-1',
                type: 'html.text',
                props: {
                  html: 'Drag blocks from the left palette into Flex or Grid. Click text to edit. Right-click for the context menu.',
                  color: '#374151',
                },
              },
              {
                id: 'flex-1',
                type: 'html.flex',
                props: {
                  direction: 'row',
                  justify: 'flex-start',
                  gap: 24,
                  wrap: 'true',
                  paddingY: 0,
                },
                children: [
                  {
                    id: 'heading-2',
                    type: 'html.heading',
                    props: {
                      html: 'Flex item',
                      level: '3',
                      color: '#111827',
                    },
                  },
                  {
                    id: 'text-2',
                    type: 'html.text',
                    props: { html: 'Another flex child', color: '#374151' },
                  },
                ],
              },
              {
                id: 'grid-1',
                type: 'html.grid',
                props: {
                  columns: 2,
                  gap: 24,
                  paddingY: 0,
                },
                children: [
                  {
                    id: 'heading-3',
                    type: 'html.heading',
                    props: {
                      html: 'Column A',
                      level: '3',
                      color: '#111827',
                    },
                  },
                  {
                    id: 'text-3',
                    type: 'html.text',
                    props: { html: 'Column B', color: '#374151' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
}
