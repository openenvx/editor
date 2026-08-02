import { sanitizeUrl } from '@openenvx/core';
import type { BlockConfig } from '@openenvx/html';
import { Column, Link, Row, Section } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

function createDefaultSlotPart(
  type: string,
  data: Record<string, unknown>
): { id: string; type: string; data: Record<string, unknown> } {
  return {
    id: `${type.replaceAll('.', '-')}-default`,
    type,
    data,
  };
}

function asNodeList(node: ReactNode | undefined): ReactNode[] {
  if (node === null || node === undefined || node === false) {
    return [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => asNodeList(child));
  }
  return [node];
}

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

/** Centered logo + horizontal nav — first predefined email pattern. */
export const headerBlock: BlockConfig = {
  type: 'email.header',
  label: 'Header',
  palette: false,
  treeIcon: 'image',
  fields: {
    paddingTop: { kind: 'number', label: 'Padding top' },
    paddingBottom: { kind: 'number', label: 'Padding bottom' },
    paddingX: { kind: 'number', label: 'Padding X' },
    marginY: { kind: 'number', label: 'Margin Y' },
  },
  defaultData: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingX: 32,
    marginY: 40,
    slots: {
      logo: [
        createDefaultSlotPart('email.image', {
          src: 'https://react.email/static/logo-without-background.png',
          alt: 'Logo',
          width: 140,
          height: 42,
        }),
      ],
      links: [
        createDefaultSlotPart('email.link', {
          label: 'About',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
        createDefaultSlotPart('email.link', {
          label: 'Blog',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
        createDefaultSlotPart('email.link', {
          label: 'Company',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
        createDefaultSlotPart('email.link', {
          label: 'Features',
          href: '#',
          color: 'rgb(75,85,99)',
        }),
      ],
    },
  },
  slots: {
    logo: {
      label: 'Logo',
      partType: 'email.image',
    },
    links: {
      label: 'Links',
      partType: 'email.link',
      repeatable: true,
    },
  },
  render: ({ data, slots }) => {
    const paddingTop = Number(data.paddingTop ?? 40);
    const paddingBottom = Number(data.paddingBottom ?? 40);
    const paddingX = Number(data.paddingX ?? 32);
    const marginY = Number(data.marginY ?? 40);
    const links = asNodeList(slots?.links);

    return (
      <Section
        style={{
          paddingTop,
          paddingBottom,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          marginTop: marginY,
          marginBottom: marginY,
        }}
      >
        <Row>
          <Column align="center">{slots?.logo}</Column>
        </Row>
        <Row style={{ marginTop: 40 }}>
          {links.map((link, index) => (
            <Column
              align="center"
              key={index}
              style={{
                paddingLeft: 8,
                paddingRight: 8,
                width: 'auto',
              }}
            >
              {link}
            </Column>
          ))}
        </Row>
      </Section>
    );
  },
};

/** Patterns shown in the Blocks gallery (not the Elements list). */
export const emailPatternBlocks: BlockConfig[] = [headerBlock];

export const emailPatternPartBlocks: BlockConfig[] = [linkBlock];
