import { SCHEMA_VERSION, type Scene } from '@openenvx/schema';

const LOGO_SRC = 'https://placehold.co/96x96/18181b/ffffff?text=B';
const SOCIAL = [
  {
    id: 'social-x',
    alt: 'X',
    src: 'https://placehold.co/36x36/18181b/ffffff?text=X',
  },
  {
    id: 'social-in',
    alt: 'LinkedIn',
    src: 'https://placehold.co/36x36/18181b/ffffff?text=in',
  },
  {
    id: 'social-yt',
    alt: 'YouTube',
    src: 'https://placehold.co/36x36/18181b/ffffff?text=YT',
  },
  {
    id: 'social-gh',
    alt: 'GitHub',
    src: 'https://placehold.co/36x36/18181b/ffffff?text=GH',
  },
] as const;

/** Barebones Activation (ConfirmEmail) as an editable email Scene — structure mirrors the React Email source. */
export function createBarebonesActivationScene(options?: {
  companyName?: string;
  url?: string;
}): Scene {
  const companyName = options?.companyName ?? 'Barebones';
  const url = options?.url ?? 'https://example.com/';

  return {
    schemaVersion: SCHEMA_VERSION,
    pages: [
      {
        id: 'email-page',
        name: 'Activation',
        layout: 'email',
        layers: [
          {
            id: 'email-root',
            type: 'email.root',
            data: {
              background: '#f4f4f5',
              preheader: 'Confirm your email address',
              padding: 0,
              children: [
                {
                  // ConfirmEmail: <Section className="bg-bg …">
                  id: 'card-section',
                  type: 'email.section',
                  data: {
                    background: '#ffffff',
                    padding: 24,
                    children: [
                      {
                        // Header row: logo | companyName
                        id: 'header-section',
                        type: 'email.section',
                        data: {
                          background: 'transparent',
                          padding: 12,
                          children: [
                            {
                              id: 'header-row',
                              type: 'email.columns',
                              data: {
                                gap: 8,
                                children: [
                                  {
                                    id: 'header-logo',
                                    type: 'email.image',
                                    data: {
                                      src: LOGO_SRC,
                                      alt: '',
                                      width: 23,
                                      height: 23,
                                    },
                                  },
                                  {
                                    id: 'header-company',
                                    type: 'email.text',
                                    data: {
                                      html: companyName,
                                      color: '#71717a',
                                      align: 'right',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        // Hero: bg-bg-2, centered
                        id: 'hero-section',
                        type: 'email.section',
                        data: {
                          background: '#f4f4f5',
                          padding: 64,
                          align: 'center',
                          children: [
                            {
                              id: 'hero-logo-heading',
                              type: 'email.section',
                              data: {
                                background: 'transparent',
                                padding: 0,
                                align: 'center',
                                children: [
                                  {
                                    id: 'hero-logo',
                                    type: 'email.image',
                                    data: {
                                      src: LOGO_SRC,
                                      alt: 'Logo',
                                      width: 48,
                                      height: 48,
                                      align: 'center',
                                    },
                                  },
                                  {
                                    id: 'hero-heading',
                                    type: 'email.heading',
                                    data: {
                                      html: "We're almost there!",
                                      level: '1',
                                      color: '#18181b',
                                      align: 'center',
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              id: 'hero-body',
                              type: 'email.text',
                              data: {
                                html: `Thank you for signing up for ${companyName}.<br />To verify your account, we just need to confirm your email address.`,
                                color: '#52525b',
                                align: 'center',
                              },
                            },
                            {
                              id: 'hero-button-wrap',
                              type: 'email.section',
                              data: {
                                background: 'transparent',
                                padding: 0,
                                align: 'center',
                                children: [
                                  {
                                    id: 'hero-button',
                                    type: 'email.button',
                                    data: {
                                      label: 'Confirm email',
                                      href: url,
                                      background: '#18181b',
                                      color: '#ffffff',
                                      align: 'center',
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              id: 'hero-ignore',
                              type: 'email.text',
                              data: {
                                html: "If you didn't request this,<br />please ignore this email.",
                                color: '#71717a',
                                align: 'center',
                              },
                            },
                          ],
                        },
                      },
                      {
                        // Footer
                        id: 'footer-section',
                        type: 'email.section',
                        data: {
                          background: '#ffffff',
                          padding: 40,
                          children: [
                            {
                              id: 'footer-slogan',
                              type: 'email.text',
                              data: {
                                html: 'Barebones is the catchy slogan that perfectly encapsulates the vision of our company.',
                                color: '#71717a',
                                align: 'center',
                              },
                            },
                            {
                              // ConfirmEmail: Section > Link(inline-block) > Img siblings
                              id: 'footer-social',
                              type: 'email.section',
                              data: {
                                background: 'transparent',
                                padding: 0,
                                align: 'center',
                                children: SOCIAL.map((social) => ({
                                  id: social.id,
                                  type: 'email.imageLink',
                                  data: {
                                    src: social.src,
                                    alt: social.alt,
                                    href: 'https://example.com/',
                                    width: 18,
                                    height: 18,
                                  },
                                })),
                              },
                            },
                            {
                              id: 'footer-address',
                              type: 'email.text',
                              data: {
                                html: '123 Market Street, Floor 1<br />Tech City, CA, 94102',
                                color: '#71717a',
                                align: 'center',
                              },
                            },
                            {
                              id: 'footer-unsubscribe',
                              type: 'email.text',
                              data: {
                                html: `<a href="https://example.com/">Unsubscribe</a> from ${companyName} marketing emails.`,
                                color: '#71717a',
                                align: 'center',
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
          },
        ],
      },
    ],
  };
}
