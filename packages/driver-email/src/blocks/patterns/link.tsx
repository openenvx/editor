import { sanitizeUrl } from '@openenvx/core';
import type { BlockConfig } from '@openenvx/html';
import { Link } from '@react-email/components';
import type { CSSProperties } from 'react';

const NAV_LINK_STYLE: CSSProperties = {
  color: 'rgb(75,85,99)',
  textDecoration: 'none',
};

/** Text link part used inside pattern slots (not listed in Elements). */
export const linkBlock: BlockConfig = {
  type: 'email.link',
  label: 'Link',
  palette: false,
  fields: {
    label: { kind: 'text', label: 'Label' },
    href: { kind: 'text', label: 'URL' },
    color: { kind: 'color', label: 'Color' },
  },
  defaultData: {
    label: 'Link',
    href: '#',
    color: 'rgb(75,85,99)',
  },
  treeIcon: 'type',
  render: ({ data }) => (
    <Link
      href={sanitizeUrl(String(data.href ?? '#'), { fallback: '#' })}
      style={{
        ...NAV_LINK_STYLE,
        color: String(data.color ?? NAV_LINK_STYLE.color),
      }}
    >
      {String(data.label ?? 'Link')}
    </Link>
  ),
};
