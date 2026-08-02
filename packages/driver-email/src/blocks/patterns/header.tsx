import { Column, Row, Section } from '@react-email/components';

import { defineEmailPattern } from './define-email-pattern';
import { linkBlock } from './link';
import { createDefaultChild, flattenChildren } from './slot-helpers';

/**
 * Centered logo + horizontal nav.
 * Children in Layers: first = logo, remaining = nav links (order contract).
 */
export default defineEmailPattern({
  group: 'Headers',
  description: 'Centered logo with horizontal navigation links.',
  tags: ['header', 'logo', 'nav', 'navigation'],
  parts: [linkBlock],
  block: {
    type: 'email.header',
    label: 'Header',
    treeIcon: 'image',
    acceptsChildren: true,
    fields: {
      paddingTop: { kind: 'number', label: 'Padding top' },
      paddingBottom: { kind: 'number', label: 'Padding bottom' },
      paddingX: { kind: 'number', label: 'Padding X' },
      marginY: { kind: 'number', label: 'Margin Y' },
    },
    defaultData: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingX: 32,
      marginY: 40,
      children: [
        createDefaultChild('email.image', {
          src: 'https://react.email/static/logo-without-background.png',
          alt: 'Logo',
          width: 140,
          height: 42,
        }),
        createDefaultChild('email.link', {
          label: 'About',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
        createDefaultChild('email.link', {
          label: 'Blog',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
        createDefaultChild('email.link', {
          label: 'Company',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
        createDefaultChild('email.link', {
          label: 'Features',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
      ],
    },
    render: ({ data, children }) => {
      const paddingTop = Number(data.paddingTop ?? 40);
      const paddingBottom = Number(data.paddingBottom ?? 40);
      const paddingX = Number(data.paddingX ?? 32);
      const marginY = Number(data.marginY ?? 40);
      const kids = flattenChildren(children);
      const [logo, ...links] = kids;

      return (
        <Section
          style={{
            paddingTop,
            paddingBottom,
            paddingLeft: paddingX,
            paddingRight: paddingX,
            marginTop: marginY,
            marginBottom: marginY,
          }}
        >
          {logo ? (
            <Row>
              <Column align="center">{logo}</Column>
            </Row>
          ) : null}
          {links.length > 0 ? (
            <Row style={{ marginTop: 40 }}>
              {links.map((link, index) => (
                <Column
                  align="center"
                  key={index}
                  style={{
                    paddingLeft: 8,
                    paddingRight: 8,
                    width: 'auto',
                  }}
                >
                  {link}
                </Column>
              ))}
            </Row>
          ) : null}
        </Section>
      );
    },
  },
});
