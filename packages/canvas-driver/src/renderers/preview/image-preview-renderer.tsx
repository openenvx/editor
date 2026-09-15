import type { LayerPreviewDescriptor } from '@openenvx/core/preview';

import type { LayerPreviewRendererHostProps } from '../../contributions/layer-preview-renderer-contribution';

import styles from './preview-renderers.module.css';

type ImageDescriptor = Extract<LayerPreviewDescriptor, { kind: 'image' }>;

export function ImagePreviewRenderer({
  descriptor,
}: LayerPreviewRendererHostProps) {
  const view = descriptor as ImageDescriptor;
  return <img alt={view.alt ?? ''} className={styles.preview} src={view.src} />;
}
