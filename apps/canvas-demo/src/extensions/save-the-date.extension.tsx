import { defineExtension, renderPanelTree } from '@xmazu/openenvxee-extensions';
/** @jsxImportSource preact */
import { Toolbar, ToolbarCommand } from '@xmazu/openenvxee-extensions/panel';

import { saveTheDateWidget } from './save-the-date.widget';

const toolbar = renderPanelTree(
  <Toolbar>
    <ToolbarCommand commandId="wm.save-the-date.insert" label="Save the date" />
  </Toolbar>
);

/** Static extension contract for the save-the-date widget. */
export default defineExtension({
  id: 'wm.save-the-date',
  name: 'Save the date',
  activation: [
    'onWidget:wm.save-the-date',
    'onCommand:wm.save-the-date.insert',
  ],
  permissions: ['widget:render', 'widget:values'],
  contributes: {
    widgets: [saveTheDateWidget],
    commands: [
      { id: 'wm.save-the-date.insert', title: 'Insert save the date' },
    ],
    chrome: {
      toolbar: toolbar.tree ?? undefined,
    },
  },
});
