import { SCHEMA_VERSION, type Scene } from '@openenvx/schema';

export function createEmailDemoScene(): Scene {
  return {
    schemaVersion: SCHEMA_VERSION,
    pages: [
      {
        id: 'email-page',
        name: 'Welcome email',
        layout: 'email',
        layers: [
          {
            id: 'email-root',
            type: 'email.root',
            data: {
              background: '#f6f9fc',
              preheader: 'Thanks for signing up',
              paddingX: 16,
              paddingY: 32,
              children: [
                {
                  id: 'section-1',
                  type: 'email.section',
                  data: {
                    background: '#ffffff',
                    paddingX: 32,
                    paddingY: 32,
                    children: [
                      {
                        id: 'heading-1',
                        type: 'email.heading',
                        data: {
                          html: 'Welcome',
                          level: '1',
                          color: '#111827',
                          align: 'left',
                        },
                      },
                      {
                        id: 'text-1',
                        type: 'email.text',
                        data: {
                          html: 'Thanks for joining. Drag blocks from the sidebar to build your email.',
                          color: '#374151',
                          align: 'left',
                        },
                      },
                      {
                        id: 'button-1',
                        type: 'email.button',
                        data: {
                          label: 'Get started',
                          href: 'https://example.com',
                          background: '#111827',
                          color: '#ffffff',
                          align: 'left',
                        },
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
