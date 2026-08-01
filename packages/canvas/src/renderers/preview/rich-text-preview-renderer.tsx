import { sanitizeHtml } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import type { LayerPreviewRendererHostProps } from '../../contributions/layer-preview-renderer-contribution';

import styles from './preview-renderers.module.css';

type RichTextDescriptor = Extract<LayerPreviewDescriptor, { kind: 'richText' }>;

export function RichTextPreviewRenderer({
  descriptor,
}: LayerPreviewRendererHostProps) {
  const view = descriptor as RichTextDescriptor;
  return (
    <div
      className={styles.preview}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(view.html) }}
    />
  );
}
