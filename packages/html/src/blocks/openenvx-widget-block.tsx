import type { BlockConfig } from '../block-config';

/**
 * Host shell for sandbox HTML widgets. Face layers live in `data.children`
 * (mapped from the isolate render tree). Not listed in the built-in palette —
 * extension blocks appear via {@link extensionBlockStore}.
 */
export const openenvxWidgetBlock: BlockConfig = {
  type: 'openenvx.widget',
  label: 'Widget',
  fields: {},
  defaultData: {
    extensionId: '',
    label: 'Widget',
    values: {},
    children: [],
  },
  acceptsChildren: true,
  palette: false,
  render: ({ data, children }) => (
    <div
      data-openenvx-widget={String(data.extensionId ?? '')}
      style={{ width: '100%' }}
    >
      {children}
    </div>
  ),
};
