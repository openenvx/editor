import type { BlockConfig } from '@openenvx/html';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

export const EVENT_GALLERY_TYPE = 'snapvelo.eventGallery';

const FILTER_ICON = (
  <svg
    aria-hidden
    fill="currentColor"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14 2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2.172a2 2 0 0 0 .586 1.414l2.828 2.828A2 2 0 0 1 6 9.828v4.363a.5.5 0 0 0 .724.447l2.17-1.085A2 2 0 0 0 10 11.763V9.829a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 0 14 4.172V2Z" />
  </svg>
);

function createGalleryImagePart(
  id: string,
  src: string
): { id: string; type: string; data: Record<string, unknown> } {
  return {
    id,
    type: 'html.image',
    data: { src, alt: 'Event photo' },
  };
}

export function createGalleryImageSlots(
  urls: readonly string[]
): Record<string, unknown> {
  return {
    images: urls.map((src, index) =>
      createGalleryImagePart(`event-gallery-img-${index + 1}`, src)
    ),
  };
}

export const eventGalleryBlock: BlockConfig = {
  type: EVENT_GALLERY_TYPE,
  label: 'Event gallery',
  treeIcon: 'image',
  palette: false,
  fields: {
    columns: { kind: 'number', label: 'Columns' },
    borderRadius: { kind: 'number', label: 'Item radius (px)' },
  },
  defaultData: {
    columns: 3,
    borderRadius: 6,
    slots: { images: [] },
  },
  slots: {
    images: {
      label: 'Images',
      partType: 'html.image',
      repeatable: true,
    },
  },
  render: ({ data, slots }): ReactElement => {
    const columns = Math.min(
      6,
      Math.max(1, Math.floor(Number(data.columns ?? 3)) || 3)
    );
    const radiusRaw = data.borderRadius;
    const radiusPx =
      radiusRaw === undefined || radiusRaw === null || radiusRaw === ''
        ? 6
        : Number(radiusRaw) || 0;
    const tileNodes = (slots?.images ?? null) as ReactNode;

    return (
      <div
        className="snapvelo-gallery"
        style={
          {
            '--snapvelo-gallery-cols': columns,
            '--snapvelo-gallery-radius': `${radiusPx}px`,
          } as CSSProperties
        }
      >
        <div className="snapvelo-gallery-toolbar">
          <button
            aria-label="Filter"
            className="snapvelo-gallery-filter"
            type="button"
          >
            {FILTER_ICON}
          </button>
        </div>
        <div className="snapvelo-gallery-grid">{tileNodes}</div>
      </div>
    );
  },
};
