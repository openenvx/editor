import type { LayerPreviewDescriptor } from '@openenvx/preview';

import type { LayerPreviewRendererHostProps } from '../../contributions/layer-preview-renderer-contribution';
import { LayerPreviewRenderer } from './layer-preview-resolver';

import styles from './preview-renderers.module.css';

type StackDescriptor = Extract<LayerPreviewDescriptor, { kind: 'stack' }>;

export function StackPreviewRenderer({
  descriptor,
}: LayerPreviewRendererHostProps) {
  const view = descriptor as StackDescriptor;
  return (
    <div
      className={
        view.direction === 'vertical'
          ? styles.stackVertical
          : styles.stackHorizontal
      }
    >
      {view.children.map((child, index) => (
        <LayerPreviewRenderer descriptor={child} key={index} />
      ))}
    </div>
  );
}
