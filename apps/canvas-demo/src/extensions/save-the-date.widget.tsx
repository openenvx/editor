/** @jsxImportSource preact */
import { QR as Qr, Stack, Text } from '@xmazu/openenvxee-elements/canvas';
import { defineCanvasComponent, string } from '@xmazu/openenvxee-widget-sdk';

/** Save-the-date canvas widget — QR + bound title. */
export const saveTheDateWidget = defineCanvasComponent({
  id: 'wm.save-the-date',
  label: 'Save the date',
  props: {
    title: string({ label: 'Title', default: 'Save the date' }),
    url: string({
      label: 'URL',
      default: 'https://openenvx.dev/wedding',
    }),
  },
  render({ props }) {
    return (
      <Stack
        direction="vertical"
        fill="#fff7ed"
        gap={12}
        padding={16}
        width={200}
      >
        <Text bind="title" fill="#9a3412" fontSize={18} value={props.title} />
        <Qr height={120} value={props.url} width={120} />
        <Text bind="url" fill="#c2410c" fontSize={10} value={props.url} />
      </Stack>
    );
  },
});
