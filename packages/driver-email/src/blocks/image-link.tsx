import { sanitizeUrl } from '@openenvx/core';
import type { BlockConfig } from '@openenvx/html';
import { Img, Link } from '@react-email/components';

/**
 * ConfirmEmail-style social/icon link: `<Link style="display:inline-block"><Img /></Link>`.
 * Inline-block (not block image) is what keeps icons side-by-side inside a Section.
 */
export const imageLinkBlock: BlockConfig = {
  type: 'email.imageLink',
  label: 'Image link',
  chromeDisplay: 'inline',
  fields: {
    src: { kind: 'image', label: 'Image' },
    alt: { kind: 'text', label: 'Alt' },
    href: { kind: 'text', label: 'Link' },
    width: { kind: 'number', label: 'Width (px)' },
    height: { kind: 'number', label: 'Height (px)' },
  },
  defaultData: {
    src: 'https://placehold.co/36x36',
    alt: '',
    href: 'https://example.com/',
    width: 18,
    height: 18,
  },
  treeIcon: 'image',
  render: ({ data }) => {
    const width = parsePx(data.width, 18);
    const height = parsePx(data.height, Number.NaN);
    const hasHeight = Number.isFinite(height) && height > 0;
    return (
      <Link
        href={sanitizeUrl(String(data.href ?? '#'), { fallback: '#' })}
        style={{
          display: 'inline-block',
          paddingLeft: 8,
          paddingRight: 8,
          verticalAlign: 'middle',
          lineHeight: 0,
          textDecoration: 'none',
        }}
      >
        <Img
          alt={String(data.alt ?? '')}
          height={hasHeight ? height : undefined}
          src={sanitizeUrl(String(data.src ?? ''), { allowDataImage: true })}
          style={{ display: 'block', border: 0 }}
          width={width > 0 ? width : 18}
        />
      </Link>
    );
  },
};

function parsePx(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const pxMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/i);
    if (pxMatch) {
      return Number(pxMatch[1]);
    }
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }
  }
  return fallback;
}
