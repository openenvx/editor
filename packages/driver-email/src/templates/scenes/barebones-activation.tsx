import {
  Button,
  Column,
  Email,
  Heading,
  ImageLink,
  Img,
  Link,
  Row,
  Section,
  Text,
  sceneFromEmailJsx,
} from '../jsx';

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
 * Barebones Activation (ConfirmEmail).
 * Authored as react-email-style JSX with inline styles; compiled to Scene on load.
 */
export function createBarebonesActivationScene(options?: {
  companyName?: string;
  url?: string;
}) {
  const companyName = options?.companyName ?? 'Barebones';
  const url = options?.url ?? 'https://example.com/';

  return sceneFromEmailJsx(
    <Email
      id="email-root"
      preheader="Confirm your email address"
      style={{
        backgroundColor: BG_2,
        paddingTop: 32,
        paddingBottom: 32,
        paddingLeft: 0,
        paddingRight: 0,
        maxWidth: 640,
      }}
    >
      <Section
        id="card-section"
        style={{
          backgroundColor: BG,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <Section
          id="header-section"
          style={{
            backgroundColor: 'transparent',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 0,
            paddingBottom: 0,
            marginBottom: 12,
          }}
        >
          <Row id="header-row">
            <Column
              id="header-logo-col"
              width="50%"
              align="left"
              verticalAlign="middle"
              style={{ paddingTop: 7, paddingBottom: 7 }}
            >
              <Row id="header-logo-row">
                <Column
                  id="header-logo-inner-col"
                  width="32px"
                  align="left"
                  verticalAlign="middle"
                >
                  <Img
                    id="header-logo"
                    src={LOGO_SRC}
                    alt=""
                    width={23}
                    height={23}
                    style={{ marginBottom: 0 }}
                  />
                </Column>
              </Row>
            </Column>
            <Column
              id="header-company-col"
              width="50%"
              align="right"
              verticalAlign="middle"
              style={{ paddingTop: 7, paddingBottom: 7 }}
            >
              <Text
                id="header-company"
                style={{
                  color: FG_3,
                  textAlign: 'right',
                  fontSize: 13,
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                {companyName}
              </Text>
            </Column>
          </Row>
        </Section>

        <Section
          id="hero-section"
          style={{
            backgroundColor: BG_2,
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 64,
            paddingBottom: 64,
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <Section
            id="hero-logo-heading"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            <Img
              id="hero-logo"
              src={LOGO_SRC}
              alt="Logo"
              width={48}
              height={48}
              style={{
                marginBottom: 20,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            />
            <Heading
              id="hero-heading"
              as="h1"
              style={{
                color: FG,
                textAlign: 'center',
                marginBottom: 0,
              }}
            >
              We&apos;re almost there!
            </Heading>
          </Section>

          <Text
            id="hero-body"
            style={{
              color: FG_2,
              textAlign: 'center',
              fontSize: 16,
              marginTop: 0,
              marginBottom: 32,
              maxWidth: 380,
            }}
          >
            Thank you for signing up for {companyName}.
            <br />
            To verify your account, we just need to confirm your email address.
          </Text>

          <Section
            id="hero-button-wrap"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            <Button
              id="hero-button"
              href={url}
              style={{
                backgroundColor: FG,
                color: '#ffffff',
                padding: '16px 28px',
                borderRadius: 8,
                fontSize: 16,
                textAlign: 'center',
              }}
            >
              Confirm email
            </Button>
          </Section>

          <Text
            id="hero-ignore"
            style={{
              color: FG_3,
              textAlign: 'center',
              fontSize: 13,
              marginTop: 32,
              marginBottom: 0,
              maxWidth: 400,
            }}
          >
            If you didn&apos;t request this,
            <br />
            please ignore this email.
          </Text>
        </Section>

        <Section
          id="footer-section"
          style={{
            backgroundColor: BG,
            padding: 0,
          }}
        >
          <Row id="footer-row">
            <Column
              id="footer-col"
              width="100%"
              align="center"
              verticalAlign="top"
              style={{
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 40,
                paddingBottom: 40,
              }}
            >
              <Text
                id="footer-slogan"
                style={{
                  color: FG_3,
                  textAlign: 'center',
                  fontSize: 13,
                  marginTop: 0,
                  marginBottom: 32,
                  maxWidth: 280,
                }}
              >
                Barebones is the catchy slogan that perfectly encapsulates the
                vision of our company.
              </Text>

              <Section
                id="footer-social"
                style={{
                  backgroundColor: 'transparent',
                  padding: 0,
                  marginBottom: 32,
                  textAlign: 'center',
                  fontSize: 0,
                  lineHeight: 0,
                }}
              >
                {SOCIAL.map((social) => (
                  <ImageLink
                    key={social.id}
                    id={social.id}
                    href={url}
                    src={social.src}
                    alt={social.alt}
                    width={18}
                    height={18}
                  />
                ))}
              </Section>

              <Text
                id="footer-address"
                style={{
                  color: FG_3,
                  textAlign: 'center',
                  fontSize: 11,
                  marginTop: 16,
                  marginBottom: 20,
                }}
              >
                123 Market Street, Floor 1
                <br />
                Tech City, CA, 94102
              </Text>

              <Text
                id="footer-unsubscribe"
                style={{
                  color: FG_3,
                  textAlign: 'center',
                  fontSize: 11,
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                <Link href={url} style={{ color: FG_3 }}>
                  Unsubscribe
                </Link>{' '}
                from {companyName} marketing emails.
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>
    </Email>,
    { pageName: 'Activation' }
  );
}
