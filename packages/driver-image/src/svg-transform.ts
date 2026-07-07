import type { Transform } from '@openenvx/schema';

export function wrapLayerSvg(body: string, transform: Transform): string {
  const { rotation, opacity } = transform;
  const scaleX = transform.scaleX ?? 1;
  const scaleY = transform.scaleY ?? 1;

  if (rotation === 0 && opacity >= 1 && scaleX === 1 && scaleY === 1) {
    return body;
  }

  const cx = transform.x + transform.width / 2;
  const cy = transform.y + transform.height / 2;
  const parts: string[] = [];

  if (rotation !== 0) {
    parts.push(`rotate(${rotation} ${cx} ${cy})`);
  }

  if (scaleX !== 1 || scaleY !== 1) {
    parts.push(`translate(${cx} ${cy})`);
    parts.push(`scale(${scaleX} ${scaleY})`);
    parts.push(`translate(${-cx} ${-cy})`);
  }

  const transformAttr =
    parts.length > 0 ? ` transform="${parts.join(' ')}"` : '';
  const opacityAttr = opacity < 1 ? ` opacity="${opacity}"` : '';

  return `<g${transformAttr}${opacityAttr}>${body}</g>`;
}
