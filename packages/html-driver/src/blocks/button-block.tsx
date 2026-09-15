import type { BlockConfig } from '../block-config';

export const buttonBlock: BlockConfig = {
  type: 'html.button',
  label: 'Button',
  fields: {
    label: { kind: 'text', label: 'Label' },
    href: { kind: 'text', label: 'Link' },
    color: { kind: 'color', label: 'Color' },
  },
  defaultData: {
    label: 'Get started',
    href: '#',
    color: '#ffffff',
  },
  render: ({ data }) => {
    const label = String(data.label ?? 'Button');
    const href = String(data.href ?? '#');
    const color = String(data.color ?? '#ffffff');
    return (
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault();
        }}
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          background: '#111827',
          color,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        {label}
      </a>
    );
  },
};
