import { describe, expect, it } from 'vitest';

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
} from './components';
import { childrenToHtml, sceneFromEmailJsx } from './scene-from-jsx';

describe('childrenToHtml', () => {
  it('serializes Link and br inside text', () => {
    const html = childrenToHtml(
      <>
        <Link href="https://example.com/" style={{ color: '#7B7D81' }}>
          Unsubscribe
        </Link>{' '}
        from Barebones
        <br />
        line two
      </>
    );
    expect(html).toContain(
      '<a href="https://example.com/" style="color:#7B7D81">Unsubscribe</a>'
    );
    expect(html).toContain('from Barebones');
    expect(html).toContain('<br />');
    expect(html).toContain('line two');
  });
});

describe('sceneFromEmailJsx', () => {
  it('compiles Email JSX with inline styles into a Scene', () => {
    const scene = sceneFromEmailJsx(
      <Email
        id="email-root"
        preheader="Hello"
        style={{
          backgroundColor: '#F3F4F6',
          paddingTop: 32,
          paddingBottom: 32,
          maxWidth: 640,
        }}
      >
        <Section
          id="hero"
          style={{
            backgroundColor: '#FFFFFF',
            padding: 24,
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <Heading as="h1" id="title" style={{ color: '#14171E', marginBottom: 0 }}>
            Welcome
          </Heading>
          <Text
            id="body"
            style={{ color: '#43454B', fontSize: 16, marginBottom: 32 }}
          >
            Thanks for joining.
          </Text>
          <Button
            id="cta"
            href="https://example.com/"
            style={{
              backgroundColor: '#14171E',
              color: '#ffffff',
              padding: '16px 28px',
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            Confirm email
          </Button>
          <Row id="row">
            <Column id="col" width="50%" align="left" verticalAlign="middle">
              <Img
                id="logo"
                src="https://placehold.co/48"
                alt="Logo"
                width={48}
                height={48}
                style={{ marginBottom: 0 }}
              />
            </Column>
          </Row>
          <Section id="social" style={{ fontSize: 0, lineHeight: 0 }}>
            <ImageLink
              id="social-x"
              href="https://example.com/"
              src="https://placehold.co/18"
              alt="X"
              width={18}
              height={18}
            />
          </Section>
        </Section>
      </Email>,
      { pageName: 'Activation' }
    );

    expect(scene.pages[0]?.name).toBe('Activation');
    expect(scene.pages[0]?.layout).toBe('email');

    const root = scene.pages[0]?.layers[0];
    expect(root?.type).toBe('email.root');
    expect(root?.data?.preheader).toBe('Hello');
    expect(root?.data?.background).toBe('#F3F4F6');
    expect(root?.data?.paddingY).toBe(32);
    expect(root?.data?.maxWidth).toBe(640);

    const json = JSON.stringify(scene);
    expect(json).toContain('"type":"email.heading"');
    expect(json).toContain('Welcome');
    expect(json).toContain('Confirm email');
    expect(json).toContain('"paddingX":28');
    expect(json).toContain('"paddingY":16');
    expect(json).toContain('"type":"email.imageLink"');

    const logo = JSON.parse(json) as {
      pages: {
        layers: {
          data?: { children?: unknown };
        }[];
      }[];
    };
    const find = (
      layers: unknown,
      id: string
    ): { data?: Record<string, unknown> } | undefined => {
      if (!Array.isArray(layers)) {
        return undefined;
      }
      for (const layer of layers) {
        if (!layer || typeof layer !== 'object') {
          continue;
        }
        const node = layer as {
          id?: string;
          data?: { children?: unknown } & Record<string, unknown>;
        };
        if (node.id === id) {
          return node;
        }
        const nested = find(node.data?.children, id);
        if (nested) {
          return nested;
        }
      }
      return undefined;
    };
    const logoLayer = find(logo.pages[0]?.layers, 'logo');
    expect(logoLayer?.data?.width).toBe(48);
    expect(logoLayer?.data?.height).toBe(48);
  });
});
