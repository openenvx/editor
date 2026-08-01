/** @jsxImportSource preact */
import { defineExtension } from '@xmazu/openenvxee-elements';
import {
  renderPanelTree,
  Toolbar,
  ToolbarCommand,
} from '@xmazu/openenvxee-elements/panel';

import { seatingWidget } from './seating.widget';

const toolbar = renderPanelTree(
  <Toolbar>
    <ToolbarCommand commandId="wm.seating.insert" label="Seating" />
  </Toolbar>
);

/** Static extension contract for the seating widget. */
export default defineExtension({
  id: 'wm.seating',
  name: 'Seating',
  activation: ['onWidget:wm.seating', 'onCommand:wm.seating.insert'],
  permissions: ['widget:render', 'widget:values'],
  contributes: {
    widgets: [seatingWidget],
    commands: [{ id: 'wm.seating.insert', title: 'Insert seating plan' }],
    chrome: {
      toolbar: toolbar.tree ?? undefined,
    },
  },
});
