import type { BlockConfig } from '@openenvx/html';
import type { CSSProperties, ReactElement } from 'react';

export const EVENT_PAGE_TYPE = 'snapvelo.root';
export const EVENT_PAGE_LAYER_ID = 'event-page';

export const eventPageBlock: BlockConfig = {
  type: EVENT_PAGE_TYPE,
  label: 'Event page',
  treeIcon: 'file',
  palette: false,
  acceptsChildren: true,
  fields: {
    backgroundColor: { kind: 'color', label: 'Background color' },
    brandColor: { kind: 'color', label: 'Brand color' },
    textColor: { kind: 'color', label: 'Text color' },
    galleryRadius: { kind: 'number', label: 'Gallery radius (px)' },
    maxWidth: { kind: 'number', label: 'Max width (px)' },
  },
  defaultData: {
    backgroundColor: '#f5f0e8',
    brandColor: '#a50016',
    textColor: '#ffffff',
    galleryRadius: 6,
    maxWidth: 1024,
    children: [],
  },
  render: ({ data, children }): ReactElement => {
    const backgroundColor = String(data.backgroundColor ?? '#f5f0e8');
    const brandColor = String(data.brandColor ?? '#a50016');
    const textColor = String(data.textColor ?? '#ffffff');
    const galleryRadius = Number(data.galleryRadius ?? 6);
    const maxWidth = Number(data.maxWidth ?? 1024);

    const tokens = {
      '--snapvelo-page-bg': backgroundColor,
      '--snapvelo-brand': brandColor,
      '--snapvelo-text': textColor,
      '--snapvelo-gallery-radius': `${galleryRadius}px`,
      '--snapvelo-max-width': `${maxWidth}px`,
    } as CSSProperties;

    // Background + tokens on .snapvelo-page (full-size flex). Chrome wrap
    // [data-layer-id='event-page'] is padding-free so outline matches the paint box.
    return (
      <div className="snapvelo-page" style={tokens}>
        <div className="snapvelo-page-inner">{children}</div>
      </div>
    );
  },
};
