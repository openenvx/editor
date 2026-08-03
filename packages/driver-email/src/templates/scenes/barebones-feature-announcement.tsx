import {
  Button,
  Column,
  Email,
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
const LOGO_ON_BLACK_SRC = 'https://placehold.co/56x56/14171E/ffffff?text=B';
const FEATURE_IMAGE_SRC =
  'https://placehold.co/592x332/E5E7EB/14171E?text=Feature';
const WAY_ICON_SRC = 'https://placehold.co/96x96/E5E7EB/14171E?text=Icon';

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

function FeatureBlock({
  id,
  imageUrl,
  ctaUrl,
  title,
  bodyP1,
  style,
}: {
  id: string;
  imageUrl: string;
  ctaUrl: string;
  title: string;
  bodyP1: string;
  style?: { marginBottom?: number };
}) {
  return (
    <Section
      id={id}
      name={title}
      style={{
        backgroundColor: 'transparent',
        padding: 0,
        marginBottom: style?.marginBottom ?? 0,
        textAlign: 'left',
      }}
    >
      <Img
        id={`${id}-image`}
        src={imageUrl}
        alt=""
        width={592}
        style={{
          marginBottom: 24,
          borderRadius: 12,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />
      <Section
        id={`${id}-copy`}
        style={{
          backgroundColor: 'transparent',
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        <Text
          id={`${id}-title`}
          style={{
            color: FG,
            textAlign: 'left',
            fontSize: 24,
            marginTop: 0,
            marginBottom: 16,
          }}
        >
          {title}
        </Text>
        <Text
          id={`${id}-body`}
          style={{
            color: FG_2,
            textAlign: 'left',
            fontSize: 16,
            marginTop: 0,
            marginBottom: 32,
            maxWidth: 420,
          }}
        >
          {bodyP1}
        </Text>
        <Button
          id={`${id}-cta`}
          href={ctaUrl}
          style={{
            backgroundColor: FG,
            color: '#ffffff',
            padding: '16px 28px',
            borderRadius: 8,
            fontSize: 16,
            textAlign: 'left',
          }}
        >
          Try it out
        </Button>
      </Section>
    </Section>
  );
}

function WayToWorkRow({
  id,
  iconSrc,
  title,
  body,
  url,
  style,
}: {
  id: string;
  iconSrc: string;
  title: string;
  body: string;
  url: string;
  style?: { marginBottom?: number };
}) {
  return (
    <Section
      id={`${id}-wrap`}
      name={title}
      style={{
        backgroundColor: 'transparent',
        padding: 0,
        marginBottom: style?.marginBottom ?? 0,
      }}
    >
      <Row id={id}>
        <Column
          id={`${id}-icon-col`}
          width="80px"
          align="left"
          verticalAlign="top"
        >
          <Img
            id={`${id}-icon`}
            src={iconSrc}
            alt=""
            width={48}
            height={48}
            style={{ marginBottom: 0 }}
          />
        </Column>
        <Column
          id={`${id}-copy-col`}
          width="100%"
          align="left"
          verticalAlign="top"
        >
          <Text
            id={`${id}-title`}
            style={{
              color: FG,
              textAlign: 'left',
              fontSize: 16,
              marginTop: 0,
              marginBottom: 6,
            }}
          >
            {title}
          </Text>
          <Text
            id={`${id}-body`}
            style={{
              color: FG_2,
              textAlign: 'left',
              fontSize: 16,
              marginTop: 0,
              marginBottom: 16,
              maxWidth: 400,
            }}
          >
            {body}
          </Text>
          <Text
            id={`${id}-link`}
            style={{
              color: FG,
              textAlign: 'left',
              fontSize: 16,
              marginTop: 0,
              marginBottom: 0,
            }}
          >
            <Link href={url} style={{ color: FG }}>
              Read more
            </Link>
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

/**
 * Barebones Feature Announcement (Release Notes).
 * Authored as react-email-style JSX with inline styles; compiled to Scene on load.
 */
export function createBarebonesFeatureAnnouncementScene(options?: {
  companyName?: string;
  url?: string;
}) {
  const companyName = options?.companyName ?? 'Barebones';
  const url = options?.url ?? 'https://example.com/';

  const featureCopy = {
    title: 'Hello feature. Goodbye old feature.',
    bodyP1:
      'Ship updates in smaller, safer steps: clearer defaults, fewer clicks, and less context switching for your team.',
  };

  return sceneFromEmailJsx(
    <Email
      id="email-root"
      preheader={`Release notes — ${companyName}`}
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
        name="Card"
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
          name="Header"
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
              <Img
                id="header-logo"
                src={LOGO_SRC}
                alt=""
                width={23}
                height={23}
                style={{ marginBottom: 0 }}
              />
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
          name="Hero"
          style={{
            backgroundColor: BG_2,
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 80,
            paddingBottom: 80,
            marginBottom: 24,
            borderRadius: 10,
            textAlign: 'center',
          }}
        >
          <Section
            id="hero-intro"
            name="Hero intro"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              marginBottom: 64,
              textAlign: 'center',
            }}
          >
            <Text
              id="hero-eyebrow"
              style={{
                color: FG_3,
                textAlign: 'center',
                fontSize: 13,
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              What&apos;s new from {companyName}
            </Text>
            <Text
              id="hero-heading"
              style={{
                color: FG,
                textAlign: 'center',
                fontSize: 40,
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              Release Notes
            </Text>
            <Text
              id="hero-body"
              style={{
                color: FG_2,
                textAlign: 'center',
                fontSize: 16,
                marginTop: 0,
                marginBottom: 0,
                maxWidth: 422,
              }}
            >
              Learn what&apos;s shipping this month, plus other {companyName}{' '}
              updates below.
            </Text>
          </Section>

          <FeatureBlock
            id="feature-1"
            imageUrl={FEATURE_IMAGE_SRC}
            ctaUrl={url}
            title={featureCopy.title}
            bodyP1={featureCopy.bodyP1}
            style={{ marginBottom: 80 }}
          />
          <FeatureBlock
            id="feature-2"
            imageUrl={FEATURE_IMAGE_SRC}
            ctaUrl={url}
            title={featureCopy.title}
            bodyP1={featureCopy.bodyP1}
          />
        </Section>

        <Section
          id="ways-section"
          name="New ways to work"
          style={{
            backgroundColor: BG_2,
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 56,
            paddingBottom: 56,
            marginBottom: 24,
            borderRadius: 10,
            textAlign: 'left',
          }}
        >
          <Text
            id="ways-heading"
            style={{
              color: FG,
              textAlign: 'left',
              fontSize: 32,
              marginTop: 0,
              marginBottom: 40,
            }}
          >
            New ways to work
          </Text>
          <WayToWorkRow
            id="way-1"
            iconSrc={WAY_ICON_SRC}
            title="Automations that save real time"
            body="Bring your workflows into one place, cut manual handoffs, and give everyone the same source of truth."
            url={url}
            style={{ marginBottom: 36 }}
          />
          <WayToWorkRow
            id="way-2"
            iconSrc={WAY_ICON_SRC}
            title="A clearer view of what needs attention"
            body="Bring your workflows into one place, cut manual handoffs, and give everyone the same source of truth."
            url={url}
          />
        </Section>

        <Section
          id="feature-3-section"
          name="Feature highlight"
          style={{
            backgroundColor: BG_2,
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 48,
            paddingBottom: 48,
            marginBottom: 24,
            borderRadius: 10,
          }}
        >
          <FeatureBlock
            id="feature-3"
            imageUrl={FEATURE_IMAGE_SRC}
            ctaUrl={url}
            title={featureCopy.title}
            bodyP1={featureCopy.bodyP1}
          />
        </Section>

        <Section
          id="cta-section"
          name="CTA"
          style={{
            backgroundColor: BG_2,
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 56,
            paddingBottom: 56,
            marginBottom: 24,
            borderRadius: 10,
            textAlign: 'center',
          }}
        >
          <Section
            id="cta-logo-wrap"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            <Img
              id="cta-logo"
              src={LOGO_ON_BLACK_SRC}
              alt=""
              width={56}
              height={56}
              style={{
                borderRadius: 12,
                marginBottom: 0,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            />
          </Section>
          <Text
            id="cta-copy"
            style={{
              color: FG,
              textAlign: 'center',
              fontSize: 28,
              marginTop: 0,
              marginBottom: 32,
              maxWidth: 420,
            }}
          >
            Start using {companyName}
            <br />
            The fastest, easiest way to use {companyName}.
          </Text>
          <Section
            id="cta-button-wrap"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
              textAlign: 'center',
            }}
          >
            <Button
              id="cta-button"
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
              Go to Dashboard
            </Button>
          </Section>
        </Section>

        <Section
          id="footer-section"
          name="Footer"
          style={{ backgroundColor: BG, padding: 0 }}
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
                {companyName} is the catchy slogan that perfectly encapsulates
                the vision of our company.
              </Text>
              <Section
                id="footer-social"
                name="Social"
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
    { pageName: 'Feature announcement' }
  );
}
