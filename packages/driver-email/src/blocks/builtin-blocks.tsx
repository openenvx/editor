import { sanitizeHtml, sanitizeUrl } from '@openenvx/core';
import type { BlockConfig } from '@openenvx/html';
import {
  Button,
  Column,
  Container,
  Heading,
  Hr,
  Img,
  Row,
  Section,
  Text,
} from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

const EMAIL_WIDTH = 600;

export const rootBlock: BlockConfig = {
  type: 'email.root',
  label: 'Email',
  fields: {
    background: { kind: 'color', label: 'Background' },
    preheader: { kind: 'text', label: 'Preheader' },
  },
  defaultData: {
    background: '#f6f9fc',
    preheader: '',
    children: [],
  },
  acceptsChildren: true,
  palette: false,
  treeIcon: 'file',
  render: ({ data, children }) => (
    <Section
      style={{
        background: String(data.background ?? '#f6f9fc'),
        width: '100%',
        minHeight: 480,
        padding: '40px 16px',
      }}
    >
      <Container
        style={{
          background: '#ffffff',
          margin: '0 auto',
          maxWidth: EMAIL_WIDTH,
          width: '100%',
          borderRadius: 4,
        }}
      >
        {children}
      </Container>
    </Section>
  ),
};

export const sectionBlock: BlockConfig = {
  type: 'email.section',
  label: 'Section',
  fields: {
    background: { kind: 'color', label: 'Background' },
    padding: { kind: 'number', label: 'Padding (px)' },
  },
  defaultData: {
    background: 'transparent',
    padding: 24,
    children: [],
  },
  acceptsChildren: true,
  render: ({ data, children }) => (
    <Section
      style={{
        background: String(data.background ?? 'transparent'),
        padding: Number(data.padding ?? 24),
      }}
    >
      {children}
    </Section>
  ),
};

export const columnsBlock: BlockConfig = {
  type: 'email.columns',
  label: 'Columns',
  fields: {
    gap: { kind: 'number', label: 'Gap (px)' },
  },
  defaultData: { gap: 16, children: [] },
  acceptsChildren: true,
  insertLineAxis: 'vertical',
  render: ({ data, children }) => {
    const childList = flattenChildren(children);
    const count = Math.max(1, childList.length);
    const width = `${Math.floor(100 / count)}%`;
    const gap = Number(data.gap ?? 16);
    return (
      <Section style={{ padding: gap / 2 }}>
        <Row>
          {childList.map((child, index) => (
            <Column
              key={index}
              style={{
                width,
                paddingLeft: gap / 2,
                paddingRight: gap / 2,
                verticalAlign: 'top',
              }}
            >
              {child}
            </Column>
          ))}
        </Row>
      </Section>
    );
  },
};

export const headingBlock: BlockConfig = {
  type: 'email.heading',
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
      ],
    },
    color: { kind: 'color', label: 'Color' },
    align: { kind: 'align', label: 'Align' },
  },
  defaultData: {
    html: 'Heading',
    level: '2',
    color: '#111827',
    align: 'left',
  },
  render: ({ data, children }) => {
    const level = Number(data.level ?? 2) as 1 | 2 | 3;
    const style: CSSProperties = {
      color: String(data.color ?? '#111827'),
      textAlign: (data.align as CSSProperties['textAlign']) ?? 'left',
      margin: '0 0 12px',
    };
    if (children) {
      // Edit mode: div keeps text-align without nesting TipTap inside <p>/<h*>.
      return <div style={style}>{children}</div>;
    }
    return (
      <Heading
        as={`h${level}`}
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(String(data.html ?? '')),
        }}
        style={style}
      />
    );
  },
};

export const textBlock: BlockConfig = {
  type: 'email.text',
  label: 'Text',
  fields: {
    html: { kind: 'richText', label: 'Text' },
    color: { kind: 'color', label: 'Color' },
    align: { kind: 'align', label: 'Align' },
  },
  defaultData: {
    html: 'Paragraph text',
    color: '#374151',
    align: 'left',
  },
  render: ({ data, children }) => {
    const style: CSSProperties = {
      color: String(data.color ?? '#374151'),
      textAlign: (data.align as CSSProperties['textAlign']) ?? 'left',
      margin: '0 0 16px',
      lineHeight: '24px',
      fontSize: 14,
    };
    if (children) {
      return <div style={style}>{children}</div>;
    }
    return (
      <Text
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(String(data.html ?? '')),
        }}
        style={style}
      />
    );
  },
};

export const buttonBlock: BlockConfig = {
  type: 'email.button',
  label: 'Button',
  fields: {
    label: { kind: 'text', label: 'Label' },
    href: { kind: 'text', label: 'Link' },
    background: { kind: 'color', label: 'Background' },
    color: { kind: 'color', label: 'Text color' },
    align: { kind: 'align', label: 'Align' },
  },
  defaultData: {
    label: 'Get started',
    href: 'https://example.com',
    background: '#111827',
    color: '#ffffff',
    align: 'left',
  },
  render: ({ data }) => (
    <Section
      style={{
        textAlign: (data.align as CSSProperties['textAlign']) ?? 'left',
      }}
    >
      <Button
        href={sanitizeUrl(String(data.href ?? '#'), { fallback: '#' })}
        style={{
          background: String(data.background ?? '#111827'),
          color: String(data.color ?? '#ffffff'),
          padding: '12px 20px',
          borderRadius: 4,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
        }}
      >
        {String(data.label ?? 'Button')}
      </Button>
    </Section>
  ),
};

export const imageBlock: BlockConfig = {
  type: 'email.image',
  label: 'Image',
  fields: {
    src: { kind: 'image', label: 'Image' },
    alt: { kind: 'text', label: 'Alt' },
    width: { kind: 'number', label: 'Width (px)' },
    height: { kind: 'number', label: 'Height (px)' },
    borderRadius: { kind: 'number', label: 'Radius (px)' },
  },
  defaultData: {
    src: 'https://placehold.co/600x200',
    alt: 'Placeholder',
    width: 600,
  },
  render: ({ data }) => {
    const height = Number(data.height);
    const hasHeight = Number.isFinite(height) && height > 0;
    const borderRadius = Number(data.borderRadius);
    const hasRadius = Number.isFinite(borderRadius) && borderRadius > 0;
    return (
      <Img
        alt={String(data.alt ?? '')}
        height={hasHeight ? height : undefined}
        src={sanitizeUrl(String(data.src ?? ''), { allowDataImage: true })}
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '100%',
          height: hasHeight ? height : 'auto',
          margin: hasHeight ? 0 : '0 0 16px',
          borderRadius: hasRadius ? borderRadius : undefined,
          objectFit: hasHeight ? 'cover' : undefined,
        }}
        width={Number(data.width ?? EMAIL_WIDTH) || EMAIL_WIDTH}
      />
    );
  },
};

export const dividerBlock: BlockConfig = {
  type: 'email.divider',
  label: 'Divider',
  fields: {
    color: { kind: 'color', label: 'Color' },
  },
  defaultData: { color: '#e5e7eb' },
  render: ({ data }) => (
    <Hr
      style={{
        borderColor: String(data.color ?? '#e5e7eb'),
        borderTopWidth: 1,
        margin: '16px 0',
      }}
    />
  ),
};

export const spacerBlock: BlockConfig = {
  type: 'email.spacer',
  label: 'Spacer',
  fields: {
    height: { kind: 'number', label: 'Height (px)' },
  },
  defaultData: { height: 24 },
  render: ({ data }) => (
    <Section
      style={{
        height: Number(data.height ?? 24),
        lineHeight: `${Number(data.height ?? 24)}px`,
      }}
    >
      &nbsp;
    </Section>
  ),
};

export const builtinEmailBlocks: BlockConfig[] = [
  rootBlock,
  sectionBlock,
  columnsBlock,
  headingBlock,
  textBlock,
  buttonBlock,
  imageBlock,
  dividerBlock,
  spacerBlock,
];

function flattenChildren(children: ReactNode): ReactNode[] {
  if (children === null || children === undefined || children === false) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenChildren(child));
  }
  return [children];
}
