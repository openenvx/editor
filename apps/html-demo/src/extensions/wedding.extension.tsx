/** @jsxImportSource preact */
import { defineExtension } from '@xmazu/openenvxee-elements';
import {
  Block,
  Pane,
  renderPanelTree,
  Text,
} from '@xmazu/openenvxee-elements/panel';

import { countdownWidget } from './countdown.widget';
import { rsvpWidget } from './rsvp.widget';

const guestsPane = renderPanelTree(
  <Pane id="wm.wedding.guests" title="Guests">
    <Block label="Guests">
      <Text
        bind="plugin.wm.wedding.guests.note"
        label="Note"
        value="RSVP submissions will appear here."
      />
    </Block>
  </Pane>
);

/** Wedding HTML extension — countdown + RSVP blocks and Guests view. */
export default defineExtension({
  id: 'wm.wedding',
  name: 'Wedding',
  activation: ['onStartup', 'onView:wm.wedding.guests'],
  permissions: ['widget:render', 'widget:values'],
  contributes: {
    blocks: [countdownWidget, rsvpWidget],
    commands: [
      { id: 'wm.countdown.insert', title: 'Insert countdown' },
      { id: 'wm.rsvp.insert', title: 'Insert RSVP' },
    ],
    viewContainers: [{ id: 'wm.wedding', title: 'Wedding', icon: 'heart' }],
    views: [
      {
        id: 'wm.wedding.guests',
        container: 'wm.wedding',
        title: 'Guests',
      },
    ],
  },
});

/** Initial Guests view body (validated panel tree). */
export const guestsViewTree = guestsPane.tree;
