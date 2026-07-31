import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';

import type { LayerPreviewRendererHostProps } from '../../contributions/layer-preview-renderer-contribution';

import styles from './preview-renderers.module.css';

type PlaceholderDescriptor = Extract<
  LayerPreviewDescriptor,
  { kind: 'placeholder' }
>;

export function PlaceholderPreviewRenderer({
  descriptor,
}: LayerPreviewRendererHostProps) {
  const view = descriptor as PlaceholderDescriptor;
  return <p className={styles.placeholder}>{view.text}</p>;
}
