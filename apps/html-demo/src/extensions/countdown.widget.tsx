/** @jsxImportSource preact */
import { Heading, Paragraph, Section } from '@openenvx/elements/html';
import { defineHtmlComponent, string } from '@openenvx/widget-sdk';

/** Countdown HTML block — target date + label props. */
export const countdownWidget = defineHtmlComponent({
  id: 'wm.countdown',
  label: 'Countdown',
  props: {
    targetDate: string({ label: 'Target date', default: '2026-09-12' }),
    label: string({ label: 'Label', default: 'Until the wedding' }),
  },
  render({ props }) {
    const end = Date.parse(props.targetDate);
    const now = Date.now();
    const days =
      Number.isFinite(end) && end > now
        ? Math.ceil((end - now) / 86_400_000)
        : 0;

    return (
      <Section background="#fdf2f8" padding={24}>
        <Heading bind="label" level={2}>
          {props.label}
        </Heading>
        <Paragraph>{`${days} days · ${props.targetDate}`}</Paragraph>
      </Section>
    );
  },
});
