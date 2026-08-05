import type { BlockConfig } from '@openenvx/html';
import type { CSSProperties, ReactElement } from 'react';

export const EVENT_LOGO_TYPE = 'snapvelo.logo';

/** Circular cover logo — matches Chivent hero mark. */
export const eventLogoBlock: BlockConfig = {
  type: EVENT_LOGO_TYPE,
  label: 'Logo',
  treeIcon: 'image',
  palette: false,
  fields: {
    src: { kind: 'image', label: 'Logo image' },
    alt: { kind: 'text', label: 'Alt' },
  },
  defaultData: {
    src: '/demo/logo.jpg',
    alt: 'Event logo',
  },
  render: ({ data }): ReactElement => {
    const src = String(data.src ?? '');
    const alt = String(data.alt ?? 'Logo');
    const style: CSSProperties = {
      position: 'absolute',
      inset: 0,
      backgroundImage: src ? `url("${src.replaceAll('"', '%22')}")` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      backgroundColor: src ? undefined : '#e5e7eb',
    };
    return <div aria-label={alt} role="img" style={style} />;
  },
};
