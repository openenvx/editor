import type { BlockConfig } from '../block-config';

export const headingBlock: BlockConfig = {
  type: 'html.heading',
  label: 'Heading',
  fields: {
    text: { kind: 'text', label: 'Text' },
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
  defaultData: { text: 'Heading', level: '2' },
  render: ({ data }) => {
    const text = String(data.text ?? '');
    const level = String(data.level ?? '2');
    switch (level) {
      case '1': {
        return <h1 style={{ margin: '0 0 0.5rem' }}>{text}</h1>;
      }
      case '3': {
        return <h3 style={{ margin: '0 0 0.5rem' }}>{text}</h3>;
      }
      case '4': {
        return <h4 style={{ margin: '0 0 0.5rem' }}>{text}</h4>;
      }
      default: {
        return <h2 style={{ margin: '0 0 0.5rem' }}>{text}</h2>;
      }
    }
  },
};

export const textBlock: BlockConfig = {
  type: 'html.text',
  label: 'Text',
  fields: {
    text: { kind: 'textarea', label: 'Text' },
  },
  defaultData: { text: 'Paragraph text' },
  render: ({ data }) => (
    <p style={{ margin: '0 0 0.75rem', lineHeight: 1.5 }}>
      {String(data.text ?? '')}
    </p>
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
