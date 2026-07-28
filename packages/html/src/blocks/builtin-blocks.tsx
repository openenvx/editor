import type { BlockConfig } from '../block-config';
import { buttonBlock } from './button-block';
import { heroBlock } from './hero-block';

export const headingBlock: BlockConfig = {
  type: 'html.heading',
  label: 'Heading',
  fields: {
    html: { kind: 'richText', label: 'Text' },
    level: {
      kind: 'select',
      label: 'Level',
      options: [
        { label: 'H1', value: '1' },
        { label: 'H2', value: '2' },
        { label: 'H3', value: '3' },
        { label: 'H4', value: '4' },
      ],
    },
    color: { kind: 'color', label: 'Color' },
  },
  defaultData: { html: 'Heading', level: '2', color: '#111827' },
  render: ({ data, children }) => {
    const html = String(data.html ?? '');
    const level = String(data.level ?? '2');
    const color = String(data.color ?? '#111827');
    const style = { margin: '0 0 0.5rem', color } as const;
    const Tag =
      level === '1' ? 'h1' : level === '3' ? 'h3' : level === '4' ? 'h4' : 'h2';
    if (children) {
      return <Tag style={style}>{children}</Tag>;
    }
    return <Tag dangerouslySetInnerHTML={{ __html: html }} style={style} />;
  },
};

export const textBlock: BlockConfig = {
  type: 'html.text',
  label: 'Text',
  fields: {
    html: { kind: 'richText', label: 'Text' },
    color: { kind: 'color', label: 'Color' },
  },
  defaultData: { html: 'Paragraph text', color: '#374151' },
  render: ({ data, children }) => {
    const style = {
      margin: '0 0 0.75rem',
      lineHeight: 1.5,
      color: String(data.color ?? '#374151'),
    };
    if (children) {
      return <div style={style}>{children}</div>;
    }
    return (
      <div
        dangerouslySetInnerHTML={{ __html: String(data.html ?? '') }}
        style={style}
      />
    );
  },
};

export const imageBlock: BlockConfig = {
  type: 'html.image',
  label: 'Image',
  fields: {
    src: { kind: 'image', label: 'Image' },
    alt: { kind: 'text', label: 'Alt' },
  },
  defaultData: {
    src: 'https://placehold.co/600x200',
    alt: 'Placeholder',
  },
  render: ({ data }) => (
    <img
      alt={String(data.alt ?? '')}
      src={String(data.src ?? '')}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '0.75rem',
      }}
    />
  ),
};

export const flexBlock: BlockConfig = {
  type: 'html.flex',
  label: 'Flex',
  fields: {
    direction: {
      kind: 'select',
      label: 'Direction',
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Column', value: 'column' },
      ],
    },
    justify: {
      kind: 'select',
      label: 'Justify Content',
      options: [
        { label: 'Start', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'flex-end' },
      ],
    },
    gap: { kind: 'number', label: 'Gap' },
    wrap: {
      kind: 'select',
      label: 'Wrap',
      options: [
        { label: 'true', value: 'true' },
        { label: 'false', value: 'false' },
      ],
    },
    paddingY: { kind: 'number', label: 'Vertical Padding' },
  },
  defaultData: {
    direction: 'row',
    justify: 'flex-start',
    gap: 24,
    wrap: 'true',
    paddingY: 0,
    children: [],
  },
  acceptsChildren: true,
  render: ({ data, children }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: data.direction === 'column' ? 'column' : 'row',
        justifyContent: String(data.justify ?? 'flex-start'),
        flexWrap: data.wrap === 'false' ? 'nowrap' : 'wrap',
        gap: Number(data.gap ?? 24),
        paddingBlock: Number(data.paddingY ?? 0),
        minHeight: 40,
        width: '100%',
      }}
    >
      {children}
    </div>
  ),
};

export const gridBlock: BlockConfig = {
  type: 'html.grid',
  label: 'Grid',
  fields: {
    columns: { kind: 'number', label: 'Number of columns' },
    gap: { kind: 'number', label: 'Gap' },
    paddingY: { kind: 'number', label: 'Vertical Padding' },
  },
  defaultData: {
    columns: 2,
    gap: 24,
    paddingY: 0,
    children: [],
  },
  acceptsChildren: true,
  render: ({ data, children }) => {
    const columns = Math.min(
      12,
      Math.max(1, Math.floor(Number(data.columns ?? 2)) || 2)
    );
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: Number(data.gap ?? 24),
          paddingBlock: Number(data.paddingY ?? 0),
          minHeight: 40,
          width: '100%',
        }}
      >
        {children}
      </div>
    );
  },
};

/** Loaded for persisted scenes; palette uses flex/grid instead. */
export const legacyContainerBlock: BlockConfig = {
  type: 'html.container',
  label: 'Container',
  fields: {
    padding: { kind: 'number', label: 'Padding (px)' },
    background: { kind: 'text', label: 'Background' },
  },
  defaultData: { padding: 16, background: 'transparent', children: [] },
  acceptsChildren: true,
  render: ({ data, children }) => (
    <div
      style={{
        padding: Number(data.padding ?? 16),
        background: String(data.background ?? 'transparent'),
        minHeight: 40,
        width: '100%',
      }}
    >
      {children}
    </div>
  ),
};

export const rootBlock: BlockConfig = {
  type: 'html.root',
  label: 'Page',
  fields: {
    background: { kind: 'text', label: 'Background' },
  },
  defaultData: { background: '#ffffff', children: [] },
  acceptsChildren: true,
  render: ({ data, children }) => (
    <div
      style={{
        background: String(data.background ?? '#ffffff'),
        minHeight: 480,
        padding: 24,
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  ),
};

export const builtinBlocks: BlockConfig[] = [
  rootBlock,
  flexBlock,
  gridBlock,
  legacyContainerBlock,
  heroBlock,
  headingBlock,
  textBlock,
  imageBlock,
  buttonBlock,
];

export function isHtmlTextBlockType(type: string): boolean {
  return type === 'html.heading' || type === 'html.text';
}
