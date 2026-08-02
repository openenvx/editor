import { Section } from '@react-email/components';

import { defineEmailPattern } from './define-email-pattern';
import { createDefaultChild, flattenChildren } from './slot-helpers';

/**
 * Hero image + centered article intro and CTA.
 * Layout container — children are Elements visible in Layers.
 * Order: image, then centered eyebrow / title / body / button.
 */
export default defineEmailPattern({
  group: 'Articles',
  description: 'Hero image with centered title, body, and read-more button.',
  tags: ['article', 'image', 'blog', 'read more', 'furniture'],
  block: {
    type: 'email.articleWithImage',
    label: 'Article with image',
    treeIcon: 'image',
    acceptsChildren: true,
    fields: {
      paddingX: { kind: 'number', label: 'Padding X' },
      paddingY: { kind: 'number', label: 'Padding Y' },
    },
    defaultData: {
      paddingX: 32,
      paddingY: 24,
      children: [
        createDefaultChild('email.image', {
          src: 'https://react.email/static/herman-miller-chair.jpg',
          alt: 'Herman Miller Chair',
          width: 536,
          height: 320,
          borderRadius: 12,
        }),
        createDefaultChild('email.text', {
          html: 'Our new article',
          color: 'rgb(79,70,229)',
          align: 'center',
        }),
        createDefaultChild('email.heading', {
          html: 'Designing with Furniture',
          level: '1',
          color: 'rgb(17,24,39)',
          align: 'center',
        }),
        createDefaultChild('email.text', {
          html: 'Unleash your inner designer as we explore how furniture plays a vital role in creating stunning interiors, offering insights into choosing the right pieces, arranging them harmoniously, and infusing your space with personality.',
          color: 'rgb(107,114,128)',
          align: 'center',
        }),
        createDefaultChild('email.button', {
          label: 'Read more',
          href: 'https://react.email',
          background: 'rgb(79,70,229)',
          color: 'rgb(255,255,255)',
          align: 'center',
        }),
      ],
    },
    render: ({ data, children }) => {
      const paddingX = Number(data.paddingX ?? 32);
      const paddingY = Number(data.paddingY ?? 24);
      const kids = flattenChildren(children);
      const [image, ...rest] = kids;
      return (
        <Section
          style={{
            paddingTop: paddingY,
            paddingBottom: paddingY,
            paddingLeft: paddingX,
            paddingRight: paddingX,
          }}
        >
          {image}
          {rest.length > 0 ? (
            <Section style={{ marginTop: 32, textAlign: 'center' }}>
              {rest}
            </Section>
          ) : null}
        </Section>
      );
    },
  },
});
