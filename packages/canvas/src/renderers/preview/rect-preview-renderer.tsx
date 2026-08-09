import type { LayerPreviewDescriptor } from '@openenvx/core/preview';

import type { LayerPreviewRendererHostProps } from '../../contributions/layer-preview-renderer-contribution';
import { normalizeCornerRadius, uniformCornerRadius } from '../../style-utils';

import styles from './preview-renderers.module.css';

type RectDescriptor = Extract<LayerPreviewDescriptor, { kind: 'rect' }>;

export function RectPreviewRenderer({
  descriptor,
}: LayerPreviewRendererHostProps) {
  const view = descriptor as RectDescriptor;
  return (
    <div
      className={styles.preview}
      style={{
        background: view.fill,
        border: view.stroke
          ? `${view.strokeWidth ?? 0}px solid ${view.stroke}`
          : undefined,
        borderRadius: uniformCornerRadius(
          normalizeCornerRadius(view.cornerRadius)
        ),
        height: 48,
        width: '100%',
      }}
    />
  );
}
