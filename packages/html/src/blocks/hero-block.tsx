import type { CSSProperties } from 'react';

import type { BlockConfig } from '../block-config';

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

export const heroBlock: BlockConfig = {
  type: 'html.hero',
  label: 'Hero',
  treeIcon: 'image',
  fields: {
    variant: {
      kind: 'select',
      label: 'Variant',
      options: [
        { label: 'Centered', value: 'centered' },
        { label: 'Left', value: 'left' },
        { label: 'Split', value: 'split' },
      ],
    },
    backgroundImage: { kind: 'image', label: 'Background' },
    overlay: { kind: 'color', label: 'Overlay' },
    minHeight: { kind: 'number', label: 'Min height' },
    paddingY: { kind: 'number', label: 'Vertical padding' },
    align: { kind: 'align', label: 'Align' },
  },
  defaultData: {
    variant: 'centered',
    backgroundImage: 'https://placehold.co/1200x600',
    overlay: '#00000066',
    minHeight: 420,
    paddingY: 64,
    align: 'center',
    slots: {
      headline: [
        createDefaultSlotPart('html.heading', {
          html: 'Build something people love',
          level: '1',
          color: '#ffffff',
        }),
      ],
      body: [
        {
          ...createDefaultSlotPart('html.text', {
            html: 'A short supporting line that explains the product.',
            color: '#f3f4f6',
          }),
          visible: true,
        },
      ],
      actions: [
        createDefaultSlotPart('html.button', {
          label: 'Get started',
          href: '#',
          color: '#ffffff',
        }),
      ],
    },
  },
  slots: {
    headline: {
      label: 'Headline',
      partType: 'html.heading',
    },
    body: {
      label: 'Body',
      partType: 'html.text',
      optional: true,
    },
    actions: {
      label: 'Actions',
      partType: 'html.button',
      repeatable: true,
    },
  },
  render: ({ data, slots }) => {
    const variant = String(data.variant ?? 'centered');
    const backgroundImage = String(data.backgroundImage ?? '');
    const overlay = String(data.overlay ?? '#00000066');
    const minHeight = Number(data.minHeight ?? 420);
    const paddingY = Number(data.paddingY ?? 64);
    const align = String(data.align ?? 'center');
    const textAlign = align === 'left' ? 'left' : 'center';

    const shellStyle: CSSProperties = {
      position: 'relative',
      display: 'flex',
      width: '100%',
      minHeight,
      paddingBlock: paddingY,
      paddingInline: 24,
      backgroundColor: '#111827',
      backgroundImage: backgroundImage
        ? `url("${backgroundImage.replaceAll('"', '%22')}")`
        : undefined,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      color: '#ffffff',
      overflow: 'hidden',
    };

    const overlayStyle: CSSProperties = {
      position: 'absolute',
      inset: 0,
      background: overlay,
      pointerEvents: 'none',
    };

    const contentStyle: CSSProperties = {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: variant === 'split' ? 'row' : 'column',
      alignItems:
        variant === 'split'
          ? 'center'
          : align === 'left'
            ? 'flex-start'
            : 'center',
      justifyContent: variant === 'split' ? 'space-between' : 'center',
      gap: 24,
      width: '100%',
      maxWidth: 960,
      marginInline: 'auto',
      textAlign,
    };

    const copyStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignItems: align === 'left' ? 'flex-start' : 'center',
      maxWidth: variant === 'split' ? 420 : 640,
      width: '100%',
    };

    const actionsStyle: CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: align === 'left' ? 'flex-start' : 'center',
      marginTop: 8,
    };

    return (
      <section style={shellStyle}>
        <div aria-hidden style={overlayStyle} />
        <div style={contentStyle}>
          <div style={copyStyle}>
            {slots?.headline}
            {slots?.body}
            <div style={actionsStyle}>{slots?.actions}</div>
          </div>
        </div>
      </section>
    );
  },
};
