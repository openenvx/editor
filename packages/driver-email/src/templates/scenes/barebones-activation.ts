import { SCHEMA_VERSION, type Scene } from '@openenvx/schema';

/** Barebones theme tokens from react-email demo `01-Barebone/theme.ts`. */
const BG = '#FFFFFF';
const BG_2 = '#F3F4F6';
const FG = '#14171E';
const FG_2 = '#43454B';
const FG_3 = '#7B7D81';

const LOGO_SRC = 'https://placehold.co/96x96/14171E/ffffff?text=B';
const SOCIAL = [
  {
    id: 'social-x',
    alt: 'X',
    src: 'https://placehold.co/36x36/14171E/ffffff?text=X',
  },
  {
    id: 'social-in',
    alt: 'LinkedIn',
    src: 'https://placehold.co/36x36/14171E/ffffff?text=in',
  },
  {
    id: 'social-yt',
    alt: 'YouTube',
    src: 'https://placehold.co/36x36/14171E/ffffff?text=YT',
  },
  {
    id: 'social-gh',
    alt: 'GitHub',
    src: 'https://placehold.co/36x36/14171E/ffffff?text=GH',
  },
] as const;

/**
 * Barebones Activation (ConfirmEmail) as an editable email Scene.
 * Spacing mirrors react-email canary `01-Barebone/activation.tsx` Tailwind classes.
 */
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
              // Body bg-bg-2; Container mt-8 max-w-[640px]
              background: BG_2,
              preheader: 'Confirm your email address',
              paddingX: 0,
              paddingY: 32,
              maxWidth: 640,
              children: [
                {
                  // Section bg-bg px-6 py-4
                  id: 'card-section',
                  type: 'email.section',
                  data: {
                    background: BG,
                    paddingX: 24,
                    paddingY: 16,
                    children: [
                      {
                        // Section mb-3 px-6
                        id: 'header-section',
                        type: 'email.section',
                        data: {
                          background: 'transparent',
                          paddingX: 24,
                          paddingY: 0,
                          marginBottom: 12,
                          children: [
                            {
                              id: 'header-row',
                              type: 'email.row',
                              data: {
                                children: [
                                  {
                                    // Column w-1/2 py-[7px] align-middle
                                    id: 'header-logo-col',
                                    type: 'email.column',
                                    data: {
                                      width: '50%',
                                      align: 'left',
                                      verticalAlign: 'middle',
                                      paddingX: 0,
                                      paddingY: 7,
                                      children: [
                                        {
                                          id: 'header-logo-row',
                                          type: 'email.row',
                                          data: {
                                            children: [
                                              {
                                                id: 'header-logo-inner-col',
                                                type: 'email.column',
                                                data: {
                                                  width: '32px',
                                                  align: 'left',
                                                  verticalAlign: 'middle',
                                                  paddingX: 0,
                                                  paddingY: 0,
                                                  children: [
                                                    {
                                                      id: 'header-logo',
                                                      type: 'email.image',
                                                      data: {
                                                        src: LOGO_SRC,
                                                        alt: '',
                                                        width: 23,
                                                        height: 23,
                                                        marginBottom: 0,
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
                                  {
                                    id: 'header-company-col',
                                    type: 'email.column',
                                    data: {
                                      width: '50%',
                                      align: 'right',
                                      verticalAlign: 'middle',
                                      paddingX: 0,
                                      paddingY: 7,
                                      children: [
                                        {
                                          id: 'header-company',
                                          type: 'email.text',
                                          data: {
                                            html: companyName,
                                            color: FG_3,
                                            align: 'right',
                                            fontSize: 13,
                                            marginTop: 0,
                                            marginBottom: 0,
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
                      {
                        // Section bg-bg-2 rounded-[8px] px-[40px] py-[64px] text-center
                        id: 'hero-section',
                        type: 'email.section',
                        data: {
                          background: BG_2,
                          paddingX: 40,
                          paddingY: 64,
                          borderRadius: 8,
                          align: 'center',
                          children: [
                            {
                              // Section mb-3
                              id: 'hero-logo-heading',
                              type: 'email.section',
                              data: {
                                background: 'transparent',
                                paddingX: 0,
                                paddingY: 0,
                                marginBottom: 12,
                                align: 'center',
                                children: [
                                  {
                                    // Img mx-auto mb-5
                                    id: 'hero-logo',
                                    type: 'email.image',
                                    data: {
                                      src: LOGO_SRC,
                                      alt: 'Logo',
                                      width: 48,
                                      height: 48,
                                      align: 'center',
                                      marginBottom: 20,
                                    },
                                  },
                                  {
                                    // Heading font-28 m-0
                                    id: 'hero-heading',
                                    type: 'email.heading',
                                    data: {
                                      html: "We're almost there!",
                                      level: '1',
                                      color: FG,
                                      align: 'center',
                                      marginBottom: 0,
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              // Text font-16 mt-0 mb-8 max-w-[380px]
                              id: 'hero-body',
                              type: 'email.text',
                              data: {
                                html: `Thank you for signing up for ${companyName}.<br />To verify your account, we just need to confirm your email address.`,
                                color: FG_2,
                                align: 'center',
                                fontSize: 16,
                                marginTop: 0,
                                marginBottom: 32,
                                maxWidth: 380,
                              },
                            },
                            {
                              // Section mb-6 text-center
                              id: 'hero-button-wrap',
                              type: 'email.section',
                              data: {
                                background: 'transparent',
                                paddingX: 0,
                                paddingY: 0,
                                marginBottom: 24,
                                align: 'center',
                                children: [
                                  {
                                    // Button px-7 py-4 rounded-lg font-16
                                    id: 'hero-button',
                                    type: 'email.button',
                                    data: {
                                      label: 'Confirm email',
                                      href: url,
                                      background: FG,
                                      color: '#ffffff',
                                      align: 'center',
                                      paddingX: 28,
                                      paddingY: 16,
                                      borderRadius: 8,
                                      fontSize: 16,
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              // Text font-13 mt-8 mb-0 max-w-[400px]
                              id: 'hero-ignore',
                              type: 'email.text',
                              data: {
                                html: "If you didn't request this,<br />please ignore this email.",
                                color: FG_3,
                                align: 'center',
                                fontSize: 13,
                                marginTop: 32,
                                marginBottom: 0,
                                maxWidth: 400,
                              },
                            },
                          ],
                        },
                      },
                      {
                        // Footer Section bg-bg
                        id: 'footer-section',
                        type: 'email.section',
                        data: {
                          background: BG,
                          paddingX: 0,
                          paddingY: 0,
                          children: [
                            {
                              id: 'footer-row',
                              type: 'email.row',
                              data: {
                                children: [
                                  {
                                    // Column px-6 py-10 text-center
                                    id: 'footer-col',
                                    type: 'email.column',
                                    data: {
                                      width: '100%',
                                      align: 'center',
                                      verticalAlign: 'top',
                                      paddingX: 24,
                                      paddingY: 40,
                                      children: [
                                        {
                                          // Text font-13 mt-0 mb-8 max-w-[280px]
                                          id: 'footer-slogan',
                                          type: 'email.text',
                                          data: {
                                            html: 'Barebones is the catchy slogan that perfectly encapsulates the vision of our company.',
                                            color: FG_3,
                                            align: 'center',
                                            fontSize: 13,
                                            marginTop: 0,
                                            marginBottom: 32,
                                            maxWidth: 280,
                                          },
                                        },
                                        {
                                          // Section mb-8; fontSize/lineHeight 0
                                          // kills inherited strut above inline icons
                                          id: 'footer-social',
                                          type: 'email.section',
                                          data: {
                                            background: 'transparent',
                                            paddingX: 0,
                                            paddingY: 0,
                                            marginBottom: 32,
                                            align: 'center',
                                            fontSize: 0,
                                            lineHeight: '0',
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
                                          // Text font-11 mt-4 mb-5
                                          id: 'footer-address',
                                          type: 'email.text',
                                          data: {
                                            html: '123 Market Street, Floor 1<br />Tech City, CA, 94102',
                                            color: FG_3,
                                            align: 'center',
                                            fontSize: 11,
                                            marginTop: 16,
                                            marginBottom: 20,
                                          },
                                        },
                                        {
                                          // Text font-11 m-0
                                          id: 'footer-unsubscribe',
                                          type: 'email.text',
                                          data: {
                                            html: `<a href="https://example.com/" style="color:${FG_3}">Unsubscribe</a> from ${companyName} marketing emails.`,
                                            color: FG_3,
                                            align: 'center',
                                            fontSize: 11,
                                            marginTop: 0,
                                            marginBottom: 0,
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
                },
              ],
            },
          },
        ],
      },
    ],
  };
}
