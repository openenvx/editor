import type { DocumentNode } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { artboardRulesLayout } from '../../test/document-fixtures';
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

function findNode(
  layers: DocumentNode[] | undefined,
  id: string
): DocumentNode | undefined {
  if (!layers) {
    return undefined;
  }
  for (const layer of layers) {
    if (layer.id === id) {
      return layer;
    }
    const nested = findNode(layer.children, id);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

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

    expect(scene.artboards[0]?.name).toBe('Activation');
    expect(artboardRulesLayout(scene.artboards[0]!)).toBe('email');

    const root = scene.artboards[0]?.nodes[0];
    expect(root?.type).toBe('email.root');
    expect(root?.props?.preheader).toBe('Hello');
    expect(root?.props?.background).toBe('#F3F4F6');
    expect(root?.props?.paddingY).toBe(32);
    expect(root?.props?.maxWidth).toBe(640);

    const json = JSON.stringify(scene);
    expect(json).toContain('"type":"email.heading"');
    expect(json).toContain('Welcome');
    expect(json).toContain('Confirm email');
    expect(json).toContain('"paddingX":28');
    expect(json).toContain('"paddingY":16');
    expect(json).toContain('"type":"email.imageLink"');

    const logoLayer = findNode(scene.artboards[0]?.nodes, 'logo');
    expect(logoLayer?.props?.width).toBe(48);
    expect(logoLayer?.props?.height).toBe(48);
  });

  it('maps name prop to layer.name for Layers labels', () => {
    const scene = sceneFromEmailJsx(
      <Email id="email-root">
        <Section id="hero" name="Hero">
          <Text id="body">Hi</Text>
        </Section>
      </Email>
    );
    const children = scene.artboards[0]?.nodes[0]?.children;
    expect(children?.[0]?.id).toBe('hero');
    expect(children?.[0]?.name).toBe('Hero');
  });
});
