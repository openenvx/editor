import {
  boolean,
  defineHtmlComponent,
  string,
} from '@xmazu/openenvxee-extensions';
/** @jsxImportSource preact */
import {
  Button,
  Heading,
  Paragraph,
  Section,
} from '@xmazu/openenvxee-extensions/html';

/** RSVP HTML block — headline, guest name, attending toggle. */
export const rsvpWidget = defineHtmlComponent({
  id: 'wm.rsvp',
  label: 'RSVP',
  props: {
    headline: string({ label: 'Headline', default: 'Will you join us?' }),
    name: string({ label: 'Guest name', default: '' }),
    attending: boolean({ label: 'Attending', default: true }),
  },
  render({ props }) {
    return (
      <Section background="#ecfdf5" padding={24}>
        <Heading bind="headline" level={2}>
          {props.headline}
        </Heading>
        <Paragraph bind="name">
          {props.name
            ? `Guest: ${props.name}`
            : 'Add your name in the Inspector'}
        </Paragraph>
        <Button>{props.attending ? 'Attending' : 'Declined'}</Button>
      </Section>
    );
  },
});
