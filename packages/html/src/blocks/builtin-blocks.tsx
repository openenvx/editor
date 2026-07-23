import type { BlockConfig } from '../block-config';

export const headingBlock: BlockConfig = {
  type: 'html.heading',
  label: 'Heading',
  fields: {
    html: { kind: 'text', label: 'Text' },
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
  },
  defaultData: { html: 'Heading', level: '2' },
  render: ({ data }) => {
    const html = String(data.html ?? '');
    const level = String(data.level ?? '2');
    const style = { margin: '0 0 0.5rem' } as const;
    switch (level) {
      case '1': {
        return <h1 dangerouslySetInnerHTML={{ __html: html }} style={style} />;
      }
      case '3': {
        return <h3 dangerouslySetInnerHTML={{ __html: html }} style={style} />;
      }
      case '4': {
        return <h4 dangerouslySetInnerHTML={{ __html: html }} style={style} />;
      }
      default: {
        return <h2 dangerouslySetInnerHTML={{ __html: html }} style={style} />;
      }
    }
  },
};

export const textBlock: BlockConfig = {
  type: 'html.text',
  label: 'Text',
  fields: {
    html: { kind: 'textarea', label: 'Text' },
  },
  defaultData: { html: 'Paragraph text' },
  render: ({ data }) => (
    <div
      dangerouslySetInnerHTML={{ __html: String(data.html ?? '') }}
      style={{ margin: '0 0 0.75rem', lineHeight: 1.5 }}
    />
  ),
};

export const imageBlock: BlockConfig = {
  type: 'html.image',
  label: 'Image',
  fields: {
    src: { kind: 'text', label: 'URL' },
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

export const containerBlock: BlockConfig = {
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
        border: '1px dashed #cbd5e1',
        borderRadius: 6,
        marginBottom: '0.75rem',
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
        maxWidth: 720,
        margin: '0 auto',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </div>
  ),
};

export const builtinBlocks: BlockConfig[] = [
  rootBlock,
  containerBlock,
  headingBlock,
  textBlock,
  imageBlock,
];

export function isHtmlTextBlockType(type: string): boolean {
  return type === 'html.heading' || type === 'html.text';
}
