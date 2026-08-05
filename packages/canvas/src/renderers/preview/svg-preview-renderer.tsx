import type { LayerPreviewDescriptor } from '@xmazu/openenvxee-preview';
import { useMemo } from 'react';

import type { LayerPreviewRendererHostProps } from '../../contributions/layer-preview-renderer-contribution';
import {
  prepareSvgMarkup,
  svgMarkupToDataUrl,
} from '../../svg/prepare-svg-markup';

import styles from './preview-renderers.module.css';

type SvgDescriptor = Extract<LayerPreviewDescriptor, { kind: 'svg' }>;

export function SvgPreviewRenderer({
  descriptor,
}: LayerPreviewRendererHostProps) {
  const view = descriptor as SvgDescriptor;
  const src = useMemo(
    () =>
      svgMarkupToDataUrl(
        prepareSvgMarkup(view.svg, {
          fill: view.fill,
          stroke: view.stroke,
          viewBox: view.viewBox,
        })
      ),
    [view.fill, view.stroke, view.svg, view.viewBox]
  );
  return <img alt="" className={styles.preview} src={src} />;
}
